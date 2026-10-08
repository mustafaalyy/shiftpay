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
  restFetchAnon,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  storeSession,
  refreshSession
} from "./supabaseClient";

export {
  getCurrentUser,
  getStoredSession,
  getSupabaseConfig,
  isSessionExpired,
  refreshSession,
  consumeOAuthSessionFromUrl,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
storeSession,
  
};

export async function loadPublicSiteContent() {
  const rows = await dbSelect("site_settings", "?select=content&id=eq.public&limit=1", null);
  return rows[0]?.content || null;
}

export async function savePublicSiteContent(session, content) {
  if (!session?.access_token) {
    throw new Error("يجب تسجيل الدخول كأدمن معتمد لحفظ محتوى الموقع السحابي.");
  }

  const rows = await dbUpsert(
    "site_settings",
    {
      id: "public",
      content,
      updated_by: session.user?.id || null,
      updated_at: new Date().toISOString()
    },
    session
  );
  return rows[0]?.content || content;
}

export async function savePublicSiteContentAnon(content) {
  const rows = await restFetchAnon(`/site_settings?on_conflict=${encodeURIComponent("id")}`, {
    method: "POST",
    body: {
      id: "public",
      content,
      updated_by: null,
      updated_at: new Date().toISOString()
    },
    prefer: "resolution=merge-duplicates,return=representation"
  });
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

  writeAuditLog(session, company.id, "company_created", "company", company.id, {
    name: company.name
  }).catch(() => {});

  return company;
}

export async function loadWorkspaceFromCloud(session, companyId) {
  const [companies, departments, shifts, employees, reports, snapshots, auditLogs, advances, installments] = await Promise.all([
    dbSelect("companies", `?select=*&${eq("id", companyId)}`, session),
    dbSelect("departments", `?select=*&${eq("company_id", companyId)}&order=name.asc`, session),
    dbSelect("shifts", `?select=*&${eq("company_id", companyId)}&order=name.asc`, session),
    dbSelect("employees", `?select=*&${eq("company_id", companyId)}&order=code.asc`, session),
    dbSelect("attendance_reports", `?select=*&${eq("company_id", companyId)}&order=created_at.desc`, session),
    dbSelect("payroll_snapshots", `?select=*&${eq("company_id", companyId)}&order=created_at.desc`, session),
    dbSelect("audit_logs", `?select=*&${eq("company_id", companyId)}&order=created_at.desc&limit=20`, session),
    dbSelect("advances", `?select=*&${eq("company_id", companyId)}&order=created_at.desc`, session).catch(() => []),
    dbSelect("advance_installments", `?select=*&${eq("company_id", companyId)}&order=installment_index.asc`, session).catch(() => [])
  ]);

  const company = companies[0];
  const mappedAdvances = (advances || []).map((advRow) => {
    const insts = (installments || [])
      .filter((i) => i.advance_id === advRow.id)
      .map(fromInstallmentRow);
    return fromAdvanceRow(advRow, insts);
  });

  return {
    settings: company?.settings || null,
    departments: departments.map(fromDepartmentRow),
    shifts: shifts.map(fromShiftRow),
    employees: employees.map(fromEmployeeRow),
    reports: reports.map(fromReportRow),
    advances: mappedAdvances,
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
  advances = [],
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

  if (advances && advances.length) {
    const advanceRows = advances.map((item) => toAdvanceRow(item, companyId, session));
    const installmentRows = advances.flatMap((item) =>
      (item.installments || []).map((inst) => toInstallmentRow(inst, item.id, companyId))
    );
    await Promise.all([
      dbUpsert("advances", advanceRows, session).catch(() => []),
      installmentRows.length ? dbUpsert("advance_installments", installmentRows, session).catch(() => []) : Promise.resolve([])
    ]);
  }

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

  writeAuditLog(session, companyId, "workspace_synced", "payroll_snapshot", snapshotId, {
    employees: employees.length,
    reports: reports.length,
    month: reportMonth
  }).catch(() => {});
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
    segments: item.segments || [],
    shift_kind: item.shiftKind || "standard",
    monthly_shift_target: Number(item.monthlyShiftTarget) || 0
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
    segments: row.segments || [],
    shiftKind: row.shift_kind || "standard",
    monthlyShiftTarget: row.monthly_shift_target || 0
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
    active: item.active !== false,
    shift_assignment_mode: item.shiftAssignmentMode || "fixed",
    flexible_weekly_rest_days: Number(item.flexibleWeeklyRestDays) || 0,
    hire_date: item.hireDate || null,
    job_title: item.jobTitle || "",
    salary_history: item.salaryHistory || []
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
    active: row.active,
    shiftAssignmentMode: row.shift_assignment_mode || "fixed",
    flexibleWeeklyRestDays: row.flexible_weekly_rest_days || 0,
    hireDate: row.hire_date || "",
    jobTitle: row.job_title || "",
    salaryHistory: row.salary_history || []
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

function toAdvanceRow(item, companyId, session) {
  return {
    id: item.id,
    company_id: companyId,
    employee_id: item.employeeId,
    total_amount: Number(item.totalAmount) || 0,
    disbursement_date: item.disbursementDate || new Date().toISOString().slice(0, 10),
    installments_count: Number(item.installmentsCount) || 1,
    start_month: item.startMonth,
    notes: item.notes || "",
    status: item.status || "active",
    created_by: session?.user?.id || null,
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function fromAdvanceRow(row, installments = []) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    totalAmount: Number(row.total_amount) || 0,
    disbursementDate: row.disbursement_date,
    installmentsCount: Number(row.installments_count) || 1,
    startMonth: row.start_month,
    notes: row.notes || "",
    status: row.status || "active",
    installments: installments,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInstallmentRow(item, advanceId, companyId) {
  return {
    id: item.id,
    advance_id: advanceId,
    company_id: companyId,
    installment_index: Number(item.installmentIndex) || 1,
    due_month: item.dueMonth,
    amount: Number(item.amount) || 0,
    status: item.status || "due",
    deducted_at: item.deductedAt || null,
    deducted_amount: Number(item.deductedAmount) || 0,
    notes: item.notes || "",
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function fromInstallmentRow(row) {
  return {
    id: row.id,
    advanceId: row.advance_id,
    installmentIndex: Number(row.installment_index) || 1,
    dueMonth: row.due_month,
    amount: Number(row.amount) || 0,
    status: row.status || "due",
    deductedAt: row.deducted_at,
    deductedAmount: Number(row.deducted_amount) || 0,
    notes: row.notes || ""
  };
}