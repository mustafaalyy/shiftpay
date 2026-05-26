import {
  dbDelete,
  dbInsert,
  dbSelect,
  dbUpdate,
  dbUpsert,
  eq,
  consumeOAuthSessionFromUrl,
  getCurrentUser,
  getStoredSession,
  getSupabaseConfig,
  isSessionExpired,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  storeSession
} from "./supabaseClient";

export {
  getCurrentUser,
  getStoredSession,
  getSupabaseConfig,
  isSessionExpired,
  consumeOAuthSessionFromUrl,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  storeSession
};

export async function loadPublicSiteContent() {
  const rows = await dbSelect("site_settings", "?select=content&id=eq.public&limit=1", null);
  return rows[0]?.content || null;
}

export async function savePublicSiteContent(session, content) {
  const rows = await dbUpsert(
    "site_settings",
    {
      id: "public",
      content,
      updated_by: session.user.id,
      updated_at: new Date().toISOString()
    },
    session
  );
  return rows[0]?.content || content;
}

export async function listCloudCompanies(session) {
  return dbSelect("companies", "?select=*&order=created_at.desc", session);
}

export async function ensureCloudCompany(session, settings) {
  const companies = await listCloudCompanies(session);
  if (companies.length > 0) return companies[0];
  const metadata = session.user?.user_metadata || {};
  const companyName = metadata.company_name || settings.companyName;
  const country = metadata.phone_country || settings.country || "EG";
  const companySettings = {
    ...settings,
    companyName,
    country,
    contactPhone: [metadata.phone_country, metadata.phone].filter(Boolean).join(" ")
  };

  const inserted = await dbInsert(
    "companies",
    {
      name: companyName,
      country,
      currency: settings.currency,
      settings: companySettings,
      owner_user_id: session.user.id
    },
    session
  );
  const company = inserted[0];

  await dbInsert(
    "company_members",
    {
      company_id: company.id,
      user_id: session.user.id,
      role: "owner",
      status: "active"
    },
    session
  );

  await writeAuditLog(session, company.id, "company_created", "company", company.id, {
    name: company.name
  });

  return company;
}

export async function loadWorkspaceFromCloud(session, companyId) {
  const [companies, departments, shifts, employees, reports, snapshots, auditLogs] = await Promise.all([
    dbSelect("companies", `?select=*&${eq("id", companyId)}`, session),
    dbSelect("departments", `?select=*&${eq("company_id", companyId)}&order=name.asc`, session),
    dbSelect("shifts", `?select=*&${eq("company_id", companyId)}&order=name.asc`, session),
    dbSelect("employees", `?select=*&${eq("company_id", companyId)}&order=code.asc`, session),
    dbSelect("attendance_reports", `?select=*&${eq("company_id", companyId)}&order=created_at.desc`, session),
    dbSelect("payroll_snapshots", `?select=*&${eq("company_id", companyId)}&order=created_at.desc`, session),
    dbSelect("audit_logs", `?select=*&${eq("company_id", companyId)}&order=created_at.desc&limit=20`, session)
  ]);

  const company = companies[0];
  return {
    settings: company?.settings || null,
    departments: departments.map(fromDepartmentRow),
    shifts: shifts.map(fromShiftRow),
    employees: employees.map(fromEmployeeRow),
    reports: reports.map(fromReportRow),
    payrollSnapshots: snapshots,
    auditLogs
  };
}

export async function syncWorkspaceToCloud({
  session,
  companyId,
  settings,
  departments,
  shifts,
  employees,
  reports,
  payrollRows,
  reportMonth
}) {
  await dbUpdate(
    "companies",
    `?${eq("id", companyId)}`,
    {
      name: settings.companyName,
      country: settings.country || "EG",
      currency: settings.currency,
      settings,
      updated_at: new Date().toISOString()
    },
    session
  );

  await Promise.all([
    departments.length
      ? dbUpsert("departments", departments.map((item) => toDepartmentRow(item, companyId)), session)
      : Promise.resolve([]),
    shifts.length ? dbUpsert("shifts", shifts.map((item) => toShiftRow(item, companyId)), session) : Promise.resolve([]),
    employees.length
      ? dbUpsert("employees", employees.map((item) => toEmployeeRow(item, companyId)), session)
      : Promise.resolve([]),
    reports.length
      ? dbUpsert("attendance_reports", reports.map((item) => toReportRow(item, companyId, session)), session)
      : Promise.resolve([])
  ]);

  const cloudDepts = await dbSelect("departments", `?select=id&${eq("company_id", companyId)}`, session);
  const localDeptIds = new Set(departments.map((department) => department.id));
  const deptIdsToDelete = cloudDepts
    .filter((department) => !localDeptIds.has(department.id))
    .map((department) => department.id);
  if (deptIdsToDelete.length) {
    await dbDelete("departments", `?id=in.(${deptIdsToDelete.join(",")})`, session);
  }

  const cloudShifts = await dbSelect("shifts", `?select=id&${eq("company_id", companyId)}`, session);
  const localShiftIds = new Set(shifts.map((shift) => shift.id));
  const shiftIdsToDelete = cloudShifts
    .filter((shift) => !localShiftIds.has(shift.id))
    .map((shift) => shift.id);
  if (shiftIdsToDelete.length) {
    await dbDelete("shifts", `?id=in.(${shiftIdsToDelete.join(",")})`, session);
  }

  const cloudEmps = await dbSelect("employees", `?select=id&${eq("company_id", companyId)}`, session);
  const localEmpIds = new Set(employees.map((employee) => employee.id));
  const empIdsToDeactivate = cloudEmps
    .filter((employee) => !localEmpIds.has(employee.id))
    .map((employee) => employee.id);
  if (empIdsToDeactivate.length) {
    await dbUpdate(
      "employees",
      `?id=in.(${empIdsToDeactivate.join(",")})`,
      { active: false, updated_at: new Date().toISOString() },
      session
    );
  }

  const snapshotId = `snapshot-${companyId}-${reportMonth}`;
  await dbUpsert(
    "payroll_snapshots",
    {
      id: snapshotId,
      company_id: companyId,
      month: reportMonth,
      rows: payrollRows,
      status: "draft",
      created_by: session.user.id,
      updated_at: new Date().toISOString()
    },
    session
  );

  await writeAuditLog(session, companyId, "workspace_synced", "payroll_snapshot", snapshotId, {
    employees: employees.length,
    reports: reports.length,
    month: reportMonth
  });
}

export async function updatePayrollStatus(session, companyId, snapshotId, status) {
  const payload = {
    status,
    updated_at: new Date().toISOString()
  };
  if (status === "approved") payload.approved_by = session.user.id;
  if (status === "paid") payload.paid_at = new Date().toISOString();

  await dbUpdate("payroll_snapshots", `?${eq("id", snapshotId)}`, payload, session);
  await writeAuditLog(session, companyId, `payroll_${status}`, "payroll_snapshot", snapshotId, payload);
}

export async function writeAuditLog(session, companyId, action, entityType, entityId, details = {}) {
  return dbInsert(
    "audit_logs",
    {
      company_id: companyId,
      user_id: session.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    },
    session
  );
}

function toDepartmentRow(item, companyId) {
  return { id: item.id, company_id: companyId, name: item.name };
}

function fromDepartmentRow(row) {
  return { id: row.id, name: row.name };
}

function toShiftRow(item, companyId) {
  return {
    id: item.id,
    company_id: companyId,
    name: item.name,
    start_time: item.startTime,
    end_time: item.endTime,
    grace_period: Number(item.gracePeriod) || 0,
    late_deduction_per_minute: Number(item.lateDeductionPerMinute) || 0,
    late_rules: item.lateRules || [],
    overtime_rate_per_minute: Number(item.overtimeRatePerMinute) || 0,
    overtime_rules: item.overtimeRules || [],
    segments: item.segments || []
  };
}

function fromShiftRow(row) {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    gracePeriod: row.grace_period,
    lateDeductionPerMinute: row.late_deduction_per_minute,
    lateRules: row.late_rules || [],
    overtimeRatePerMinute: row.overtime_rate_per_minute || 0,
    overtimeRules: row.overtime_rules || [],
    segments: row.segments || []
  };
}

function toEmployeeRow(item, companyId) {
  return {
    id: item.id,
    company_id: companyId,
    code: item.code,
    name: item.name,
    department_id: item.departmentId,
    shift_id: item.shiftId,
    salary: Number(item.salary) || 0,
    vacation_balance: Number(item.vacationBalance) || 0,
    extra_deductions: Number(item.extraDeductions) || 0,
    bonuses: Number(item.bonuses) || 0,
    notes: item.notes || "",
    active: item.active
  };
}

function fromEmployeeRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    departmentId: row.department_id,
    shiftId: row.shift_id,
    salary: row.salary,
    vacationBalance: row.vacation_balance,
    extraDeductions: row.extra_deductions,
    bonuses: row.bonuses,
    notes: row.notes || "",
    active: row.active
  };
}

function toReportRow(item, companyId, session) {
  return {
    id: item.id,
    company_id: companyId,
    month: item.month,
    file_name: item.fileName,
    rows_count: item.rows,
    logs: item.logs || [],
    status: item.status || "draft",
    created_by: session.user.id,
    created_at: item.createdAt || new Date().toISOString()
  };
}

function fromReportRow(row) {
  return {
    id: row.id,
    month: row.month,
    fileName: row.file_name,
    rows: row.rows_count,
    logs: row.logs || [],
    status: row.status || "draft",
    createdAt: row.created_at
  };
}
