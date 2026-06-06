export const DEPARTMENT_PRESETS = [
  "HR",
  "IT",
  "Sales",
  "Marketing",
  "Accounting",
  "Operations",
  "Customer Service",
  "Warehouse",
  "Security",
  "Administration",
  "Other"
];

export const WEEK_DAYS = [
  { key: "sat", label: "السبت", day: 6 },
  { key: "sun", label: "الأحد", day: 0 },
  { key: "mon", label: "الإثنين", day: 1 },
  { key: "tue", label: "الثلاثاء", day: 2 },
  { key: "wed", label: "الأربعاء", day: 3 },
  { key: "thu", label: "الخميس", day: 4 },
  { key: "fri", label: "الجمعة", day: 5 }
];

export const COUNTRY_PROFILES = {
  EG: {
    code: "EG",
    name: "مصر",
    localeLabel: "العربية المصرية",
    currency: "جنيه",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+20 100 000 0000"
  },
  SA: {
    code: "SA",
    name: "السعودية",
    localeLabel: "العربية السعودية",
    currency: "ريال سعودي",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+966 55 000 0000"
  },
  AE: {
    code: "AE",
    name: "الإمارات",
    localeLabel: "العربية الإماراتية",
    currency: "درهم إماراتي",
    workDays: ["mon", "tue", "wed", "thu", "fri"],
    weekends: ["sat", "sun"],
    supportPhone: "+971 50 000 0000"
  },
  KW: {
    code: "KW",
    name: "الكويت",
    localeLabel: "العربية الكويتية",
    currency: "دينار كويتي",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+965 5000 0000"
  },
  QA: {
    code: "QA",
    name: "قطر",
    localeLabel: "العربية القطرية",
    currency: "ريال قطري",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+974 3000 0000"
  },
  BH: {
    code: "BH",
    name: "البحرين",
    localeLabel: "العربية البحرينية",
    currency: "دينار بحريني",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+973 3000 0000"
  },
  OM: {
    code: "OM",
    name: "عُمان",
    localeLabel: "العربية العُمانية",
    currency: "ريال عُماني",
    workDays: ["sun", "mon", "tue", "wed", "thu"],
    weekends: ["fri", "sat"],
    supportPhone: "+968 9000 0000"
  }
};

export const COUNTRY_OPTIONS = Object.values(COUNTRY_PROFILES);

const FIXED_OFFICIAL_HOLIDAYS = {
  EG: [
    ["01-07", "عيد الميلاد المجيد"],
    ["01-25", "ثورة 25 يناير وعيد الشرطة"],
    ["04-25", "عيد تحرير سيناء"],
    ["05-01", "عيد العمال"],
    ["06-30", "ثورة 30 يونيو"],
    ["07-23", "ثورة 23 يوليو"],
    ["10-06", "عيد القوات المسلحة"]
  ],
  SA: [
    ["02-22", "يوم التأسيس"],
    ["09-23", "اليوم الوطني السعودي"]
  ],
  AE: [
    ["01-01", "رأس السنة الميلادية"],
    ["12-02", "عيد الاتحاد"],
    ["12-03", "عطلة عيد الاتحاد"]
  ],
  KW: [
    ["01-01", "رأس السنة الميلادية"],
    ["02-25", "اليوم الوطني"],
    ["02-26", "يوم التحرير"]
  ],
  QA: [
    ["12-18", "اليوم الوطني القطري"]
  ],
  BH: [
    ["01-01", "رأس السنة الميلادية"],
    ["05-01", "عيد العمال"],
    ["12-16", "اليوم الوطني"],
    ["12-17", "عطلة اليوم الوطني"]
  ],
  OM: [
    ["01-01", "رأس السنة الميلادية"],
    ["11-25", "العيد الوطني"],
    ["11-26", "عطلة العيد الوطني"]
  ]
};

const YEARLY_OFFICIAL_HOLIDAYS = {
  2026: {
    EG: [
      ["2026-03-22", "عيد الفطر"],
      ["2026-03-23", "عطلة عيد الفطر"],
      ["2026-04-13", "شم النسيم"],
      ["2026-05-27", "وقفة عرفات"],
      ["2026-05-28", "عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"],
      ["2026-06-16", "رأس السنة الهجرية"],
      ["2026-08-25", "المولد النبوي"]
    ],
    SA: [
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-03-23", "عطلة عيد الفطر"],
      ["2026-05-26", "وقفة عرفات"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"]
    ],
    AE: [
      ["2026-03-19", "عطلة عيد الفطر"],
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-05-26", "وقفة عرفات"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"],
      ["2026-06-16", "رأس السنة الهجرية"],
      ["2026-08-25", "المولد النبوي"]
    ],
    KW: [
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-05-26", "وقفة عرفات"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"],
      ["2026-06-16", "رأس السنة الهجرية"],
      ["2026-08-25", "المولد النبوي"]
    ],
    QA: [
      ["2026-02-10", "اليوم الرياضي للدولة"],
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-03-23", "عطلة عيد الفطر"],
      ["2026-05-26", "وقفة عرفات"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"]
    ],
    BH: [
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"],
      ["2026-06-16", "رأس السنة الهجرية"],
      ["2026-06-24", "عاشوراء"],
      ["2026-06-25", "عطلة عاشوراء"],
      ["2026-08-25", "المولد النبوي"]
    ],
    OM: [
      ["2026-01-15", "يوم تولي السلطان مقاليد الحكم"],
      ["2026-01-18", "الإسراء والمعراج"],
      ["2026-03-19", "عطلة عيد الفطر"],
      ["2026-03-20", "عيد الفطر"],
      ["2026-03-21", "عطلة عيد الفطر"],
      ["2026-03-22", "عطلة عيد الفطر"],
      ["2026-03-23", "عطلة عيد الفطر"],
      ["2026-05-26", "عطلة عيد الأضحى"],
      ["2026-05-27", "عيد الأضحى"],
      ["2026-05-28", "عطلة عيد الأضحى"],
      ["2026-05-29", "عطلة عيد الأضحى"],
      ["2026-05-30", "عطلة عيد الأضحى"],
      ["2026-06-18", "رأس السنة الهجرية"],
      ["2026-08-27", "المولد النبوي"]
    ]
  }
};

const DAY_INDEX_BY_KEY = WEEK_DAYS.reduce((acc, day) => {
  acc[day.key] = day.day;
  return acc;
}, {});

export const DEFAULT_SETTINGS = {
  companyName: "شركة المسار الذكي",
  companyLogo: "",
  country: "EG",
  currency: "جنيه",
  payrollMonthDays: 30,
  workDays: ["sun", "mon", "tue", "wed", "thu"],
  weekends: ["fri", "sat"],
  holidayOverrides: [],
  absencePolicy: "خصم يوم كامل من الراتب الأساسي",
  payrollSettings: "يتم تطبيق رصيد الإجازات تلقائيا قبل خصم الغياب."
};

export const DEFAULT_DEPARTMENTS = [
  { id: "dep-hr", name: "HR" },
  { id: "dep-it", name: "IT" },
  { id: "dep-sales", name: "Sales" },
  { id: "dep-ops", name: "Operations" },
  { id: "dep-acc", name: "Accounting" }
];

export const DEFAULT_SHIFTS = [
  {
    id: "shift-morning",
    name: "فترة صباحية",
    startTime: "09:00",
    endTime: "17:00",
    gracePeriod: 15,
    lateDeductionPerMinute: 1.5,
    overtimeRatePerMinute: 2,
    lateRules: [
      { id: "rule-m-5", afterMinutes: 5, deductionAmount: 25 },
      { id: "rule-m-10", afterMinutes: 10, deductionAmount: 50 },
      { id: "rule-m-30", afterMinutes: 30, deductionAmount: 100 }
    ],
    overtimeRules: [
      { id: "ot-m-15", afterMinutes: 15, bonusAmount: 40 },
      { id: "ot-m-60", afterMinutes: 60, bonusAmount: 150 }
    ],
    shiftKind: "standard",
    monthlyShiftTarget: 0,
    segments: [{ startTime: "09:00", endTime: "17:00" }]
  },
  {
    id: "shift-support",
    name: "فترة مسائية",
    startTime: "14:00",
    endTime: "22:00",
    gracePeriod: 10,
    lateDeductionPerMinute: 2,
    overtimeRatePerMinute: 2.5,
    lateRules: [
      { id: "rule-s-5", afterMinutes: 5, deductionAmount: 30 },
      { id: "rule-s-15", afterMinutes: 15, deductionAmount: 80 },
      { id: "rule-s-30", afterMinutes: 30, deductionAmount: 140 }
    ],
    overtimeRules: [
      { id: "ot-s-15", afterMinutes: 15, bonusAmount: 50 },
      { id: "ot-s-60", afterMinutes: 60, bonusAmount: 180 }
    ],
    shiftKind: "standard",
    monthlyShiftTarget: 0,
    segments: [{ startTime: "14:00", endTime: "22:00" }]
  }
];

export const DEFAULT_EMPLOYEES = [
  {
    id: "emp-1",
    code: "E001",
    name: "أحمد محمود",
    departmentId: "dep-hr",
    shiftId: "shift-morning",
    salary: 15000,
    vacationBalance: 2,
    extraDeductions: 0,
    bonuses: 750,
    shiftAssignmentMode: "fixed",
    weeklyRestMode: "fixed",
    flexibleWeeklyRestDays: 0,
    notes: "مسؤول ملفات الموظفين",
    active: true
  },
  {
    id: "emp-2",
    code: "E002",
    name: "سارة علي",
    departmentId: "dep-it",
    shiftId: "shift-morning",
    salary: 22000,
    vacationBalance: 1,
    extraDeductions: 300,
    bonuses: 1200,
    shiftAssignmentMode: "fixed",
    weeklyRestMode: "fixed",
    flexibleWeeklyRestDays: 0,
    notes: "مهندسة نظم",
    active: true
  },
  {
    id: "emp-3",
    code: "E003",
    name: "محمود حسن",
    departmentId: "dep-sales",
    shiftId: "shift-support",
    salary: 18000,
    vacationBalance: 3,
    extraDeductions: 0,
    bonuses: 1900,
    shiftAssignmentMode: "fixed",
    weeklyRestMode: "fixed",
    flexibleWeeklyRestDays: 0,
    notes: "مبيعات الشركات",
    active: true
  },
  {
    id: "emp-4",
    code: "E004",
    name: "نوران سامي",
    departmentId: "dep-ops",
    shiftId: "shift-morning",
    salary: 17000,
    vacationBalance: 0,
    extraDeductions: 500,
    bonuses: 400,
    shiftAssignmentMode: "fixed",
    weeklyRestMode: "fixed",
    flexibleWeeklyRestDays: 0,
    notes: "عمليات التشغيل",
    active: true
  },
  {
    id: "emp-5",
    code: "E005",
    name: "كريم فتحي",
    departmentId: "dep-acc",
    shiftId: "shift-morning",
    salary: 14000,
    vacationBalance: 1,
    extraDeductions: 0,
    bonuses: 0,
    shiftAssignmentMode: "fixed",
    weeklyRestMode: "fixed",
    flexibleWeeklyRestDays: 0,
    notes: "تم أرشفته مؤقتا",
    active: false
  }
];

export function formatCurrency(value, currency = "جنيه") {
  const number = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0
  }).format(number)} ${currency}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

export function parseTimeToMinutes(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    const normalized = value > 1 ? value / 24 : value;
    return Math.round(normalized * 24 * 60);
  }

  if (value instanceof Date) {
    return value.getHours() * 60 + value.getMinutes();
  }

  const text = String(value).trim();
  const ampm = text.match(/(am|pm|ص|م)$/i)?.[1]?.toLowerCase();
  const match = text.match(/(\d{1,2})[:.](\d{1,2})/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (ampm === "pm" || ampm === "م") {
    if (hours < 12) hours += 12;
  }
  if (ampm === "am" || ampm === "ص") {
    if (hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  if (minutes === null || minutes === undefined) return "-";
  const safe = Math.max(0, minutes);
  const hours = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const mins = (safe % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function normalizeDate(value) {
  if (!value && value !== 0) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }

  if (typeof value === "number") {
    return excelSerialToIso(value);
  }

  const text = String(value).trim();
  if (!text) return "";

  const parts = text.split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (String(parts[0]).length === 4) {
      return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
    }
    if (c > 31) {
      return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return toIsoDate(date);
  return "";
}

export function getReportMonth(attendanceLogs) {
  const first = attendanceLogs.find((log) => normalizeDate(log.date));
  if (!first) return new Date().toISOString().slice(0, 7);
  return normalizeDate(first.date).slice(0, 7);
}

export function getMonthLabel(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  return date.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

export function getCountryProfile(countryCode = "EG") {
  return COUNTRY_PROFILES[countryCode] || COUNTRY_PROFILES.EG;
}

export function getOfficialHolidays(countryCode = "EG", year = new Date().getFullYear()) {
  const code = getCountryProfile(countryCode).code;
  const fixed = (FIXED_OFFICIAL_HOLIDAYS[code] || []).map(([monthDay, name]) => ({
    date: `${year}-${monthDay}`,
    name,
    fixed: true
  }));
  const yearly = (YEARLY_OFFICIAL_HOLIDAYS[year]?.[code] || []).map(([date, name]) => ({
    date,
    name,
    fixed: false
  }));

  return [...fixed, ...yearly].sort((a, b) => a.date.localeCompare(b.date));
}

export function getEffectiveHolidays(settings, year = new Date().getFullYear()) {
  const countryCode = settings?.country || "EG";
  const overrides = Array.isArray(settings?.holidayOverrides) ? settings.holidayOverrides : [];
  const byBaseKey = new Map(overrides.filter((item) => item.baseKey).map((item) => [item.baseKey, item]));
  const official = getOfficialHolidays(countryCode, year).flatMap((holiday) => {
    const baseKey = getHolidayKey(holiday, countryCode);
    const override = byBaseKey.get(baseKey);
    if (override?.enabled === false) return [];
    return [
      {
        ...holiday,
        baseDate: holiday.date,
        baseKey,
        date: normalizeDate(override?.date) || holiday.date,
        name: override?.name?.trim() || holiday.name,
        enabled: true,
        adjusted: Boolean(override && normalizeDate(override.date) !== holiday.date),
        note: override?.note || ""
      }
    ];
  });

  const custom = overrides
    .filter(
      (item) =>
        !item.baseKey &&
        item.enabled !== false &&
        (!item.country || item.country === countryCode) &&
        normalizeDate(item.date).startsWith(String(year))
    )
    .map((item) => ({
      date: normalizeDate(item.date),
      name: item.name?.trim() || "إجازة مخصصة",
      enabled: true,
      custom: true,
      note: item.note || ""
    }));

  return [...official, ...custom]
    .filter((holiday) => holiday.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthlyHolidayAlerts(settings, month) {
  if (!month) return [];
  const year = Number(month.slice(0, 4));
  return getEffectiveHolidays(settings, year).filter((holiday) => holiday.date.startsWith(month));
}

export function getHolidayForDate(date, countryCode = "EG") {
  const year = Number(normalizeDate(date).slice(0, 4));
  return getOfficialHolidays(countryCode, year).find((holiday) => holiday.date === normalizeDate(date));
}

export function getHolidayKey(holiday, countryCode = "EG") {
  return `${countryCode}-${holiday.date}-${normalizeHeader(holiday.name)}`;
}

export function buildDefaultAttendance() {
  const scheduledDates = listDatesInMonth("2026-05", DEFAULT_SETTINGS.workDays);
  const patterns = {
    E001: { name: "أحمد محمود", absent: [], late: { 6: 17, 14: 11 } },
    E002: { name: "سارة علي", absent: [11], late: { 4: 26, 13: 19, 20: 34 } },
    E003: { name: "محمود حسن", absent: [7, 18], late: { 5: 22, 12: 41, 21: 18, 25: 35 } },
    E004: { name: "نوران سامي", absent: [10, 17, 24], late: { 3: 13, 19: 28, 26: 46 } }
  };

  return Object.entries(patterns).flatMap(([employeeCode, config]) =>
    scheduledDates
      .filter((date) => !config.absent.includes(Number(date.slice(-2))))
      .map((date) => {
        const day = Number(date.slice(-2));
        const shift = employeeCode === "E003" ? DEFAULT_SHIFTS[1] : DEFAULT_SHIFTS[0];
        const start = parseTimeToMinutes(shift.startTime);
        const end = parseTimeToMinutes(shift.endTime);
        const lateMinutes = config.late[day] || (day % 9 === 0 ? 7 : 0);

        return {
          employeeCode,
          name: config.name,
          date,
          checkIn: minutesToTime(start + lateMinutes),
          checkOut: minutesToTime(end + (day % 4 === 0 ? 8 : 0))
        };
      })
  );
}
function isShiftCountMode(shift) {
  return shift?.shiftKind === "shift_count";
}

function getMonthlyShiftTarget(shift, fallback) {
  return Number(shift?.monthlyShiftTarget) || fallback;
}

function getEmployeeLogDates(groupedLogs, employeeCode, reportMonth) {
  const dates = [];
  groupedLogs.forEach((_, key) => {
    const sep = key.indexOf("__");
    if (sep === -1) return;
    const code = key.slice(0, sep);
    const date = key.slice(sep + 2);
    if (String(code).trim() === String(employeeCode).trim() && date.startsWith(reportMonth)) {
      dates.push(date);
    }
  });
  return dates;
}

function detectShiftForDate({ groupedLogs, employeeCode, date, shifts }) {
  const key = `${String(employeeCode).trim()}__${date}`;
  const log = groupedLogs.get(key);
  if (!log || log.checkIn === null) return { shift: shifts[0], score: 0, needsReview: false };
  const checkInMinutes = log.checkIn;
  let best = { shift: shifts[0], diff: Infinity, needsReview: false };
  for (const shift of shifts) {
    const start = parseTimeToMinutes(shift.startTime);
    const diff = Math.abs(checkInMinutes - start);
    if (diff < best.diff) best = { shift, diff, needsReview: diff > 90 };
  }
  return { shift: best.shift, score: best.diff, needsReview: best.needsReview };
}

function buildShiftLogForDate(groupedLogs, employeeCode, date, shift) {
  const key = `${String(employeeCode).trim()}__${date}`;
  const log = groupedLogs.get(key);
  if (!log) return null;
  return {
    date,
    checkIn: log.checkIn !== null ? minutesToTime(log.checkIn) : "",
    checkOut: log.checkOut !== null ? minutesToTime(log.checkOut) : "",
    punches: log.punches || [],
    raw: log
  };
}

function allocateFlexibleRestDates(missingDates, allowedRestDays) {
  return missingDates.slice(0, allowedRestDays);
}

export function calculatePayroll({ employees, departments, shifts, attendanceLogs, settings, reportMonth }) {
  const activeEmployees = employees.filter((employee) => employee.active);
  const activeReportMonth = reportMonth || getReportMonth(attendanceLogs);
  const scheduledDates = listWorkingDatesInMonth(activeReportMonth, settings);
  const groupedLogs = groupAttendance(attendanceLogs);
  const departmentMap = mapById(departments);
  const shiftMap = mapById(shifts);
  const availableShifts = shifts.length ? shifts : DEFAULT_SHIFTS;
  const scheduledDayCount = Math.max(
    Number(settings.payrollMonthDays) || scheduledDates.length,
    1
  );

  return activeEmployees.map((employee) => {
    const shift = shiftMap[employee.shiftId] || availableShifts[0] || DEFAULT_SHIFTS[0];
    const department = departmentMap[employee.departmentId]?.name || "غير محدد";
    const usesAutoShift = employee.shiftAssignmentMode === "auto";
    const shiftCountMode = isShiftCountMode(shift);
    const scheduledUnits = shiftCountMode ? getMonthlyShiftTarget(shift, scheduledDates.length) : scheduledDates.length;
    const dailySalary = Number(employee.salary || 0) / Math.max(
      shiftCountMode ? scheduledUnits : scheduledDayCount,
      1
    );
    const evaluationDates = shiftCountMode
      ? getEmployeeLogDates(groupedLogs, employee.code, activeReportMonth)
      : scheduledDates;

    let presentDays = 0;
    let lateCount = 0;
    let lateMinutes = 0;
    let lateDeductions = 0;
    let overtimeCount = 0;
    let overtimeMinutes = 0;
    let overtimeBonuses = 0;
    let incompleteSplitDays = 0;
    let autoShiftDays = 0;
    const presentDates = new Set();
    const detectedShiftCounts = new Map();
    const splitWarnings = [];

    evaluationDates.forEach((date) => {
      const detected = usesAutoShift
        ? detectShiftForDate({
            groupedLogs,
            employeeCode: employee.code,
            date,
            shifts: availableShifts
          })
        : { shift, score: 0, needsReview: false };
      const activeShift = detected.shift || shift;
      const log = buildShiftLogForDate(groupedLogs, employee.code, date, activeShift);
      if (!log) return;

      const dayResult = evaluateShiftDay({
        log,
        shift: activeShift,
        segments: getShiftSegments(activeShift),
        requiresCompleteSession: isShiftCountMode(activeShift)
      });
      if (!dayResult.hasWork) return;

      presentDays += 1;
      presentDates.add(date);
      lateCount += dayResult.lateCount;
      lateMinutes += dayResult.lateMinutes;
      lateDeductions += dayResult.lateDeductions;
      overtimeCount += dayResult.overtimeCount;
      overtimeMinutes += dayResult.overtimeMinutes;
      overtimeBonuses += dayResult.overtimeBonuses;

      if (usesAutoShift) {
        autoShiftDays += 1;
        detectedShiftCounts.set(activeShift.name, (detectedShiftCounts.get(activeShift.name) || 0) + 1);
        if (detected.needsReview) {
          splitWarnings.push({
            date,
            label: "الشيفت المكتشف تلقائيا يحتاج مراجعة"
          });
        }
      }

      if (dayResult.incomplete) {
        incompleteSplitDays += 1;
        splitWarnings.push({
          date,
          label: dayResult.warning
        });
      }
    });

    const missingDates = scheduledDates.filter((date) => !presentDates.has(date));
    const flexibleRestDates =
      !shiftCountMode && employee.weeklyRestMode === "flexible"
        ? allocateFlexibleRestDates(missingDates, Number(employee.flexibleWeeklyRestDays) || 0)
        : [];
    const flexibleRestUsage = flexibleRestDates.length;
    const absenceDays = shiftCountMode
      ? Math.max(0, scheduledUnits - presentDays)
      : Math.max(0, missingDates.length - flexibleRestUsage);
    const vacationUsage = shiftCountMode ? 0 : Math.min(absenceDays, Number(employee.vacationBalance) || 0);
    const unpaidAbsenceDays = Math.max(0, absenceDays - vacationUsage);
    const absenceDeductions = unpaidAbsenceDays * dailySalary;
    const extraDeductions = Number(employee.extraDeductions) || 0;
    const manualBonuses = Number(employee.bonuses) || 0;
    const bonuses = manualBonuses + overtimeBonuses;
    const totalDeductions = lateDeductions + absenceDeductions + extraDeductions;
    const netSalary = Number(employee.salary || 0) - totalDeductions + bonuses;
    const status = getAttendanceStatus({ absenceDays, lateCount, incompleteSplitDays });
    const detectedShiftSummary = [...detectedShiftCounts.entries()]
      .map(([name, count]) => `${name} (${count})`)
      .join("، ");
    const operationNotes = [
      shiftCountMode ? `حساب بعدد الشيفتات: ${presentDays}/${scheduledUnits}` : "",
      usesAutoShift && detectedShiftSummary ? `اكتشاف تلقائي: ${detectedShiftSummary}` : "",
      flexibleRestUsage > 0 ? `راحة مرنة: ${flexibleRestUsage} يوم` : "",
      incompleteSplitDays > 0 ? "يوجد شيفت غير مكتمل" : ""
    ].filter(Boolean);

    return {
      employeeId: employee.id,
      employeeCode: employee.code,
      employeeName: employee.name,
      department,
      shift: usesAutoShift && detectedShiftSummary ? detectedShiftSummary : shift.name,
      shiftMode: usesAutoShift ? "auto" : "fixed",
      shiftKind: shift.shiftKind || "standard",
      autoShiftDays,
      status,
      attendanceDays: presentDays,
      scheduledDays: scheduledUnits,
      officialHolidays: getEffectiveHolidays(settings, Number(activeReportMonth.slice(0, 4))).filter(
        (holiday) => holiday.date.startsWith(activeReportMonth)
      ).length,
      lateCount,
      lateMinutes,
      incompleteSplitDays,
      splitWarnings,
      absenceDays,
      flexibleRestUsage,
      flexibleRestDates,
      vacationUsage,
      unpaidAbsenceDays,
      lateDeductions,
      absenceDeductions,
      extraDeductions,
      deductions: totalDeductions,
      manualBonuses,
      overtimeCount,
      overtimeMinutes,
      overtimeBonuses,
      bonuses,
      salary: Number(employee.salary) || 0,
      netSalary,
      currency: settings.currency || "جنيه",
      reportMonth: activeReportMonth,
      operationNotes
    };
  });
}

const ATTENDANCE_FIELD_LABELS = {
  employeeCode: "EmployeeCode",
  name: "Name",
  date: "Date",
  checkIn: "CheckIn",
  checkOut: "CheckOut",
  punchTime: "PunchTime",
  direction: "Direction",
  dateTime: "DateTime"
};

const ATTENDANCE_COLUMN_ALIASES = {
  employeeCode: [
    "EmployeeCode",
    "Employee Code",
    "EmpCode",
    "Emp ID",
    "Employee ID",
    "ID",
    "Code",
    "كود الموظف",
    "رقم الموظف",
    "كود",
    "الكود",
    "رقم"
  ],
  name: ["Name", "EmployeeName", "Employee Name", "Full Name", "الاسم", "اسم الموظف", "الموظف"],
  date: ["Date", "AttendanceDate", "Attendance Date", "Log Date", "Day", "التاريخ", "تاريخ", "اليوم"],
  checkIn: [
    "CheckIn",
    "Check In",
    "ClockIn",
    "Clock In",
    "Time In",
    "In",
    "Punch In",
    "دخول",
    "حضور",
    "وقت الحضور",
    "وقت الدخول"
  ],
  checkOut: [
    "CheckOut",
    "Check Out",
    "ClockOut",
    "Clock Out",
    "Time Out",
    "Out",
    "Punch Out",
    "خروج",
    "انصراف",
    "وقت الانصراف",
    "وقت الخروج"
  ],
  punchTime: [
    "Time",
    "PunchTime",
    "Punch Time",
    "LogTime",
    "Log Time",
    "Clock",
    "Scan Time",
    "وقت",
    "الوقت",
    "وقت البصمة",
    "ساعة البصمة"
  ],
  direction: [
    "Direction",
    "Status",
    "Type",
    "Punch Type",
    "Event",
    "In/Out",
    "الحركة",
    "نوع الحركة",
    "نوع البصمة",
    "الحالة"
  ],
  dateTime: [
    "DateTime",
    "Date Time",
    "PunchDateTime",
    "Punch Date Time",
    "LogDateTime",
    "Log Date Time",
    "Timestamp",
    "تاريخ ووقت",
    "وقت وتاريخ",
    "تاريخ البصمة"
  ]
};

export async function parseAttendanceFile(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const columnMap = detectAttendanceColumnMap(rows[0] || {});
  const punchColumns = detectPunchColumns(rows[0] || {}, columnMap);
  const hasDateSource = Boolean(columnMap.date || columnMap.dateTime);
  const hasTimeSource = Boolean(
    columnMap.checkIn ||
      columnMap.checkOut ||
      columnMap.punchTime ||
      columnMap.dateTime ||
      punchColumns.length
  );
  const missingColumns = [
    !columnMap.employeeCode ? ATTENDANCE_FIELD_LABELS.employeeCode : "",
    !hasDateSource ? ATTENDANCE_FIELD_LABELS.date : "",
    !hasTimeSource ? "CheckIn/CheckOut أو PunchTime" : ""
  ].filter(Boolean);

  if (missingColumns.length > 0) {
    return {
      logs: [],
      errors: [
        `الأعمدة الناقصة: ${missingColumns.join(", ")}. يدعم النظام أسماء عربية أو إنجليزية قريبة لنفس المعنى.`
      ],
      totalRows: rows.length,
      validRows: 0,
      groupedRows: 0,
      previewRows: [],
      mappedColumns: getMappedColumns(columnMap, punchColumns),
      formatType: "غير معروف"
    };
  }

  const errors = [];
  const validLogs = [];

  rows.forEach((row, index) => {
    const sourceRow = index + 2;
    const parsedDateTime = parseDateTimeValue(readMappedValue(row, columnMap.dateTime));
    const employeeCode = String(readMappedValue(row, columnMap.employeeCode) || "").trim();
    const name = String(readMappedValue(row, columnMap.name) || "").trim();
    const date = normalizeDate(readMappedValue(row, columnMap.date)) || parsedDateTime.date;
    const direction = normalizePunchDirection(readMappedValue(row, columnMap.direction));
    const punches = [];
    const checkInMinutes = parseTimeToMinutes(readMappedValue(row, columnMap.checkIn));
    const checkOutMinutes = parseTimeToMinutes(readMappedValue(row, columnMap.checkOut));
    const rowPunchMinutes =
      parseTimeToMinutes(readMappedValue(row, columnMap.punchTime)) ?? parsedDateTime.minutes;

    let finalCheckIn = checkInMinutes;
    let finalCheckOut = checkOutMinutes;
    if (rowPunchMinutes !== null) {
      punches.push(rowPunchMinutes);
      if (direction === "out" && finalCheckOut === null) finalCheckOut = rowPunchMinutes;
      if (direction === "in" && finalCheckIn === null) finalCheckIn = rowPunchMinutes;
    }

    punchColumns.forEach((column) => {
      const minutes = parseTimeToMinutes(row[column.name]);
      if (minutes === null) return;
      punches.push(minutes);
      if (column.role === "in") {
        finalCheckIn = finalCheckIn === null ? minutes : Math.min(finalCheckIn, minutes);
      }
      if (column.role === "out") {
        finalCheckOut = finalCheckOut === null ? minutes : Math.max(finalCheckOut, minutes);
      }
    });

    if (!employeeCode || !date || (finalCheckIn === null && finalCheckOut === null && punches.length === 0)) {
      errors.push(`صف ${sourceRow}: كود الموظف أو التاريخ أو وقت الحضور غير مكتمل.`);
      return;
    }

    validLogs.push({
      employeeCode,
      name,
      date,
      checkIn: finalCheckIn === null ? "" : minutesToTime(finalCheckIn),
      checkOut: finalCheckOut === null ? "" : minutesToTime(finalCheckOut),
      punches: [...new Set(punches.filter((time) => time !== null).sort((a, b) => a - b))].map(minutesToTime)
    });
  });

  const logs = compactAttendanceLogs(validLogs);

  return {
    logs,
    errors,
    totalRows: rows.length,
    validRows: validLogs.length,
    groupedRows: logs.length,
    previewRows: logs.slice(0, 5),
    mappedColumns: getMappedColumns(columnMap, punchColumns),
    formatType: getAttendanceFormatLabel(columnMap, punchColumns)
  };
}

function detectAttendanceColumnMap(firstRow) {
  const availableColumns = Object.keys(firstRow);
  const normalizedColumns = new Map(
    availableColumns.map((column) => [normalizeHeader(column), column])
  );

  return Object.fromEntries(
    Object.entries(ATTENDANCE_COLUMN_ALIASES).map(([field, aliases]) => [
      field,
      aliases.map(normalizeHeader).map((alias) => normalizedColumns.get(alias)).find(Boolean) || ""
    ])
  );
}

function detectPunchColumns(firstRow, columnMap) {
  const usedColumns = new Set(Object.values(columnMap).filter(Boolean));
  return Object.keys(firstRow)
    .filter((column) => !usedColumns.has(column))
    .map((column) => ({ name: column, role: getPunchColumnRole(column) }))
    .filter((column) => column.role);
}

function getPunchColumnRole(column) {
  const header = normalizeHeader(column);
  if (
    /(checkin|clockin|timein|punchin|firstin|signin|^in\d*$)/.test(header) ||
    header.includes("دخول") ||
    header.includes("حضور")
  ) {
    return "in";
  }
  if (
    /(checkout|clockout|timeout|punchout|lastout|signout|^out\d*$)/.test(header) ||
    header.includes("خروج") ||
    header.includes("انصراف")
  ) {
    return "out";
  }
  if (
    /(punch|scan|clock|time|logtime|timestamp)/.test(header) ||
    header.includes("وقت") ||
    header.includes("بصمه")
  ) {
    return "neutral";
  }
  return "";
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\s_\-./()]+/g, "");
}

function readMappedValue(row, column) {
  return column ? row[column] : "";
}

function getMappedColumns(columnMap, punchColumns = []) {
  return [
    ...Object.entries(columnMap)
      .filter(([field, column]) => column || ["employeeCode", "name", "date", "checkIn", "checkOut"].includes(field))
      .map(([field, column]) => ({
        label: ATTENDANCE_FIELD_LABELS[field],
        column
      })),
    ...punchColumns.map((column) => ({
      label: column.role === "in" ? "In column" : column.role === "out" ? "Out column" : "Punch column",
      column: column.name
    }))
  ];
}

function getAttendanceFormatLabel(columnMap, punchColumns) {
  if (columnMap.dateTime || columnMap.punchTime) return "سجل بصمة لكل حركة";
  if (punchColumns.length > 0) return "أعمدة بصمات متعددة";
  return "حضور وانصراف مباشر";
}

function parseDateTimeValue(value) {
  if (!value && value !== 0) return { date: "", minutes: null };

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      date: toIsoDate(value),
      minutes: value.getHours() * 60 + value.getMinutes()
    };
  }

  if (typeof value === "number") {
    const days = Math.floor(value);
    const fraction = value - days;
    return {
      date: excelSerialToIso(days),
      minutes: fraction > 0 ? parseTimeToMinutes(fraction) : null
    };
  }

  const text = String(value).trim();
  const dateMatch = text.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
  const timeMatch = text.match(/(\d{1,2}[:.]\d{1,2}\s*(?:am|pm|ص|م)?)/i);

  return {
    date: normalizeDate(dateMatch?.[1] || text),
    minutes: timeMatch ? parseTimeToMinutes(timeMatch[1]) : null
  };
}

function normalizePunchDirection(value) {
  const text = normalizeHeader(value);
  if (!text) return "";
  if (["in", "checkin", "clockin", "timein", "punchin", "دخول", "حضور"].some((key) => text.includes(key))) {
    return "in";
  }
  if (["out", "checkout", "clockout", "timeout", "punchout", "خروج", "انصراف"].some((key) => text.includes(key))) {
    return "out";
  }
  return "";
}

function compactAttendanceLogs(logs) {
  const grouped = new Map();

  logs.forEach((log) => {
    const date = normalizeDate(log.date);
    if (!log.employeeCode || !date) return;

    const key = `${log.employeeCode}__${date}`;
    const checkIn = parsePunchValue(log.checkIn);
    const checkOut = parsePunchValue(log.checkOut);
    const current = grouped.get(key) || {
      employeeCode: log.employeeCode,
      name: log.name,
      date,
      checkIn: null,
      checkOut: null,
      punches: []
    };
    const punches = Array.isArray(log.punches)
      ? log.punches.map(parsePunchValue).filter((time) => time !== null)
      : [];
    if (checkIn !== null) punches.push(checkIn);
    if (checkOut !== null) punches.push(checkOut);

    if (checkIn !== null) {
      current.checkIn = current.checkIn === null ? checkIn : Math.min(current.checkIn, checkIn);
    }
    if (checkOut !== null) {
      current.checkOut = current.checkOut === null ? checkOut : Math.max(current.checkOut, checkOut);
    }
    if (!current.name && log.name) current.name = log.name;
    current.punches = [...new Set([...current.punches, ...punches])].sort((a, b) => a - b);
    if (current.checkIn === null && current.punches.length) current.checkIn = current.punches[0];
    if (current.checkOut === null && current.punches.length > 1) current.checkOut = current.punches.at(-1);

    grouped.set(key, current);
  });

  return [...grouped.values()]
    .map((log) => ({
      employeeCode: log.employeeCode,
      name: log.name,
      date: log.date,
      checkIn: log.checkIn === null ? "" : minutesToTime(log.checkIn),
      checkOut: log.checkOut === null ? "" : minutesToTime(log.checkOut),
      punches: log.punches.map(minutesToTime)
    }))
    .sort((a, b) => `${a.date}-${a.employeeCode}`.localeCompare(`${b.date}-${b.employeeCode}`));
}

function getAttendanceStatus({ absenceDays, lateCount, incompleteSplitDays = 0 }) {
  if (incompleteSplitDays > 0) {
    return { label: "مراجعة", tone: "yellow" };
  }
  if (absenceDays === 0 && lateCount <= 1) {
    return { label: "ملتزم", tone: "green" };
  }
  if (absenceDays <= 1 && lateCount <= 3) {
    return { label: "مراجعة", tone: "yellow" };
  }
  return { label: "متكرر", tone: "red" };
}

function groupAttendance(attendanceLogs) {
  const grouped = new Map();

  attendanceLogs.forEach((rawLog) => {
    const date = normalizeDate(rawLog.date);
    if (!rawLog.employeeCode || !date) return;

    const key = `${String(rawLog.employeeCode).trim()}__${date}`;
    const checkIn = parsePunchValue(rawLog.checkIn);
    const checkOut = parsePunchValue(rawLog.checkOut);
    const rawPunches = Array.isArray(rawLog.punches)
      ? rawLog.punches.map(parsePunchValue).filter((time) => time !== null)
      : [];
    if (checkIn !== null) rawPunches.push(checkIn);
    if (checkOut !== null) rawPunches.push(checkOut);
    const current = grouped.get(key) || { checkIn: null, checkOut: null, punches: [] };
    const punches = [...new Set([...current.punches, ...rawPunches])].sort((a, b) => a - b);

    grouped.set(key, {
      checkIn:
        checkIn === null
          ? current.checkIn ?? punches[0] ?? null
          : current.checkIn === null
            ? checkIn
            : Math.min(current.checkIn, checkIn),
      checkOut:
        checkOut === null
          ? current.checkOut ?? (punches.length > 1 ? punches.at(-1) : null)
          : current.checkOut === null
            ? checkOut
            : Math.max(current.checkOut, checkOut),
      punches
    });
  });

  return grouped;
}

function evaluateShiftDay({ log, shift, segments }) {
  const punches = getAttendancePunches(log);
  const grace = Number(shift.gracePeriod) || 0;
  const result = {
    hasWork: false,
    incomplete: false,
    warning: "",
    lateCount: 0,
    lateMinutes: 0,
    lateDeductions: 0,
    overtimeCount: 0,
    overtimeMinutes: 0,
    overtimeBonuses: 0
  };

  segments.forEach((segment, index) => {
    const start = parseTimeToMinutes(segment.startTime);
    const end = parseTimeToMinutes(segment.endTime);
    if (start === null || end === null) return;

    const nextStart = parseTimeToMinutes(segments[index + 1]?.startTime);
    const windowStart = start - 180;
    // For split shifts: each segment window ends at segment end + half the gap to next segment
    const windowEnd = nextStart !== null
      ? Math.round((end + nextStart) / 2)
      : end + 360;

    const segmentPunches =
      segments.length > 1
        ? punches.filter((time) => time >= windowStart && time <= windowEnd)
        : punches;

    // For split shifts: distinguish checkIn (near segment start) vs checkOut (near segment end)
    let checkIn = null;
    let checkOut = null;

    if (segments.length > 1) {
      // Punches within 3h of segment start = checkIn candidates
      const checkInWindow = segmentPunches.filter((t) => t <= start + 180);
      // Punches within 3h after segment start and up to end+90 = checkOut candidates
      const checkOutWindow = segmentPunches.filter((t) => t >= start + 30 && t <= end + 90);

      checkIn = checkInWindow[0] ?? null;
      checkOut = checkOutWindow.length > 1
        ? checkOutWindow.at(-1)
        : checkOutWindow.length === 1 && checkOutWindow[0] !== checkIn
          ? checkOutWindow[0]
          : null;

      // If no checkIn found but we have a punch near segment end, treat as present (checkOut only)
      if (checkIn === null && checkOutWindow.length > 0) {
        checkOut = checkOutWindow.at(-1);
      }
    } else {
      checkIn = segmentPunches[0] ?? null;
      checkOut = segmentPunches.length > 1 ? segmentPunches.at(-1) : null;
    }

    if (checkIn !== null || checkOut !== null) result.hasWork = true;

    // Late check: only if checkIn is after start + grace (and we have a real checkIn)
    if (checkIn !== null && checkIn > start + grace) {
      const minutes = checkIn - (start + grace);
      result.lateCount += 1;
      result.lateMinutes += minutes;
      result.lateDeductions += getLateDeduction(minutes, shift);
    }

    // Overtime: checkOut beyond segment end
    if (checkOut !== null && checkOut > end) {
      const minutes = checkOut - end;
      result.overtimeCount += 1;
      result.overtimeMinutes += minutes;
      result.overtimeBonuses += getOvertimeBonus(minutes, shift);
    }
  });

  return result;
}

function getAttendancePunches(log) {
  const punches = Array.isArray(log.punches)
    ? log.punches.map(parsePunchValue).filter((time) => time !== null)
    : [];
  const checkIn = parsePunchValue(log.checkIn);
  const checkOut = parsePunchValue(log.checkOut);
  if (checkIn !== null) punches.push(checkIn);
  if (checkOut !== null) punches.push(checkOut);
  return [...new Set(punches)].sort((a, b) => a - b);
}

function parsePunchValue(value) {
  if (typeof value === "number" && value > 24 && value <= 1440) return Math.round(value);
  return parseTimeToMinutes(value);
}

function getShiftSegments(shift) {
  const source = Array.isArray(shift.segments) && shift.segments.length
    ? shift.segments
    : [{ startTime: shift.startTime, endTime: shift.endTime }];
  return source
    .map((segment) => ({
      startTime: segment.startTime || shift.startTime,
      endTime: segment.endTime || shift.endTime
    }))
    .filter((segment) => parseTimeToMinutes(segment.startTime) !== null && parseTimeToMinutes(segment.endTime) !== null)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

function listWorkingDatesInMonth(month, settings) {
  const dates = listDatesInMonth(month, settings.workDays);
  const holidays = new Set(
    getEffectiveHolidays(settings, Number(month.slice(0, 4))).map((holiday) => holiday.date)
  );
  return dates.filter((date) => !holidays.has(date));
}

function listDatesInMonth(month, workDays) {
  const [year, monthIndex] = month.split("-").map(Number);
  const wantedDays = new Set((workDays || []).map((key) => DAY_INDEX_BY_KEY[key]));
  const dates = [];
  const date = new Date(year, monthIndex - 1, 1);

  while (date.getMonth() === monthIndex - 1) {
    if (wantedDays.has(date.getDay())) {
      dates.push(toIsoDate(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function getLateDeduction(minutes, shift) {
  const rules = Array.isArray(shift.lateRules)
    ? shift.lateRules
        .map((rule) => ({
          afterMinutes: Number(rule.afterMinutes) || 0,
          deductionAmount: Number(rule.deductionAmount) || 0
        }))
        .filter((rule) => rule.afterMinutes > 0)
        .sort((a, b) => a.afterMinutes - b.afterMinutes)
    : [];

  const activeRule = rules.filter((rule) => minutes >= rule.afterMinutes).pop();
  if (activeRule) return activeRule.deductionAmount;
  return minutes * (Number(shift.lateDeductionPerMinute) || 0);
}

function getOvertimeBonus(minutes, shift) {
  const rules = Array.isArray(shift.overtimeRules)
    ? shift.overtimeRules
        .map((rule) => ({
          afterMinutes: Number(rule.afterMinutes) || 0,
          bonusAmount: Number(rule.bonusAmount) || 0
        }))
        .filter((rule) => rule.afterMinutes > 0)
        .sort((a, b) => a.afterMinutes - b.afterMinutes)
    : [];

  const activeRule = rules.filter((rule) => minutes >= rule.afterMinutes).pop();
  if (activeRule) return activeRule.bonusAmount;
  return minutes * (Number(shift.overtimeRatePerMinute) || 0);
}

function mapById(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function excelSerialToIso(serial) {
  if (!Number.isFinite(serial)) return "";
  const days = Math.floor(serial);
  const date = new Date(Date.UTC(1899, 11, 30 + days));
  return toIsoDate(date);
}