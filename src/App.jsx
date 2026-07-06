import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  BookOpen,
  Landmark,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  ChevronLeft,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Headphones,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Trash2,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  UploadCloud,
  Users,
  Wallet
} from "lucide-react";
import {
  calculatePayroll,
  COUNTRY_OPTIONS,
  DEFAULT_SETTINGS,
  DEPARTMENT_PRESETS,
  detectIncompleteAttendanceDays,
  formatCurrency,
  formatNumber,
  getEffectiveHolidays,
  getCountryProfile,
  getHolidayKey,
  getMonthlyHolidayAlerts,
  getOfficialHolidays,
  getMonthLabel,
  getReportMonth,
  parseAttendanceFile,
  WEEK_DAYS
} from "./lib/payroll";
import { exportAccountingJournal, exportAttendanceTemplate, exportBankTransferSheet, exportElementToPdf, exportEmployeeTemplate, exportPayrollToXlsx } from "./lib/exporters";
import { makeId, useLocalStorage } from "./lib/storage";
import {
  ensureCloudCompany,
  getCurrentUser,
  getStoredSession,
  getSupabaseConfig,
  isSessionExpired,
  loadPublicSiteContent,
  listCloudCompanies,
  loadWorkspaceFromCloud,
  savePublicSiteContent,
  consumeOAuthSessionFromUrl,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  syncWorkspaceToCloud,
  refreshSession,
  storeSession
} from "./lib/cloudStore";

const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const defaultAttendance = [];
const defaultReports = [];
const SITE_ADMIN_EMAIL = (import.meta.env.VITE_SITE_ADMIN_EMAIL || "").trim().toLowerCase();
const SITE_ADMIN_PASSWORD = (import.meta.env.VITE_SITE_ADMIN_PASSWORD || "").trim();
const SITE_ADMIN_USERNAME = (import.meta.env.VITE_SITE_ADMIN_USERNAME || "admin").trim().toLowerCase();

function makeEmptyShift() {
  return {
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    gracePeriod: 15,
    lateDeductionPerMinute: 1.5,
    overtimeRatePerMinute: 2,
    lateRules: [
      { id: makeId("rule"), afterMinutes: 15, deductionFraction: 0.25 },
      { id: makeId("rule"), afterMinutes: 30, deductionFraction: 0.5 },
      { id: makeId("rule"), afterMinutes: 60, deductionFraction: 1.0 }
    ],
    overtimeRules: [
      { id: makeId("ot"), afterMinutes: 30, overtimeMultiplier: 1.0 },
      { id: makeId("ot"), afterMinutes: 60, overtimeMultiplier: 1.5 },
      { id: makeId("ot"), afterMinutes: 120, overtimeMultiplier: 2.0 }
    ],
    incompletePunchRules: [
      { id: makeId("ip"), occurrence: 1, deductionFraction: 0.25 },
      { id: makeId("ip"), occurrence: 2, deductionFraction: 0.5 },
      { id: makeId("ip"), occurrence: 3, deductionFraction: 1.0 }
    ],
    shiftKind: "standard",
    monthlyShiftTarget: "",
    segments: [{ id: makeId("seg"), startTime: "09:00", endTime: "17:00" }]
  };
}

const DEFAULT_SITE_CONTENT = {
  logo: "",
  heroBadge: "نظام SaaS لحساب الرواتب",
  heroTitle: "حوّل ملف البصمة إلى تقرير رواتب جاهز تلقائياً",
  heroHighlight: "تقرير رواتب جاهز",
  heroText:
    "ارفع ملف الحضور من جهاز البصمة، وخلّي ShiftPay يحسب التأخير والأوفر تايم والغياب والإجازات — بدقة كاملة وبدون أخطاء يدوية.",
  primaryCta: "ابدأ تجربة مجانية",
  secondaryCta: "اعرف أكثر",
  footerText: "نظام عربي للشركات الصغيرة والمتوسطة يربط الحضور بالإجازات والسياسات المحلية.",
  supportPhone: "+20 100 000 0000",
  supportEmail: "support@shiftpayhr.com",
  supportText: "دعم فني طوال أيام العمل",
  landing: {
    navLinks: [
      { label: "المميزات", target: "features" },
      { label: "لماذا ShiftPay؟", target: "comparison" },
      { label: "الأسعار", target: "pricing" },
      { label: "تواصل معنا", target: "support" }
    ],
    loginCta: "تسجيل الدخول",
    heroTrust: [
      "بياناتك محمية بالكامل",
      "إعداد في أقل من 10 دقائق",
      "دعم عطلات 7 دول عربية"
    ],
    comparisonBadge: "الفرق واضح",
    comparisonTitle: "الطريقة القديمة مقابل ShiftPay",
    comparisonDesc: "بدل ما تقضي أيام في الحسابات اليدوية، خلّي النظام يعمل كل حاجة في دقائق.",
    comparisonOldLabel: "الطريقة القديمة",
    comparisonNewLabel: "مع ShiftPay",
    comparisonOld: [
      { title: "ملفات Excel يدوية", desc: "تنقل بيانات البصمة يدوياً وتحسب كل موظف لوحده — عرضة للأخطاء البشرية" },
      { title: "وقت ضائع", desc: "أيام كاملة كل شهر لمراجعة الحضور والانصراف وحساب الخصومات والإضافات" },
      { title: "أخطاء متكررة", desc: "خطأ واحد في صف Excel ممكن يأثر على راتب موظف ويسبب مشاكل" }
    ],
    comparisonNew: [
      { title: "رفع ملف واحد", desc: "ارفع ملف البصمة من أي جهاز حضور — والنظام يتعامل معاه تلقائياً" },
      { title: "نتائج فورية", desc: "تقرير رواتب كامل في دقائق — مع تفاصيل التأخير والأوفر تايم لكل موظف" },
      { title: "دقة بدون أخطاء", desc: "حسابات آلية دقيقة — لا أخطاء بشرية ولا سطور مفقودة من الـ Excel" }
    ],
    featuresBadge: "المميزات",
    featuresTitle: "كل اللي تحتاجه لإدارة رواتب موظفيك",
    featuresDesc: "أدوات جاهزة تغطي الحضور والرواتب والإجازات من أول يوم.",
    features: [
      { title: "أنواع شيفتات متعددة", desc: "صباحي، مسائي، منقسم، و24 ساعة — حدد نوع الشيفت لكل موظف والنظام يحسب تلقائياً بناءً عليه." },
      { title: "حساب التأخير تلقائياً", desc: "النظام بيحسب التأخير بالدقيقة ويطبق قواعد الخصم اللي انت حاددها — بدون تدخل يدوي." },
      { title: "الأوفر تايم", desc: "حساب ساعات العمل الإضافية تلقائياً مع إمكانية تحديد نسبة الأوفر تايم حسب سياسة شركتك." },
      { title: "إدارة الإجازات", desc: "سجّل إجازات الموظفين (سنوية، مرضية، عارضة) والنظام بيحسب الرصيد تلقائياً ويخصم من الراتب لو لازم." },
      { title: "عطلات 7 دول عربية", desc: "النظام بيتعرف على العطلات الرسمية لمصر والسعودية والإمارات والأردن والعراق والكويت والبحرين." },
      { title: "أرشفة وتقارير", desc: "أرشف تقارير الرواتب شهرياً وصدّرها Excel أو PDF — ارجعلها في أي وقت للمراجعة أو للمحاسب." }
    ],
    pricingBadge: "الأسعار",
    pricingTitle: "باقات واضحة بدون رسوم مخفية",
    pricingDesc: "اختار الباقة المناسبة لحجم شركتك — جميع الباقات تشمل كل المميزات.",
    pricingBasic: {
      name: "الأساسية",
      desc: "للشركات الصغيرة — حتى 30 موظف",
      amount: "2,000",
      period: "سنوياً",
      cta: "ابدأ الآن",
      features: ["حتى 30 موظف", "جميع أنواع الشيفتات", "حساب التأخير والأوفر تايم", "تقارير شهرية", "دعم فني عبر الإيميل"]
    },
    pricingPro: {
      badge: "الأكثر طلباً",
      name: "الاحترافية",
      desc: "للشركات المتوسطة — حتى 75 موظف",
      amount: "3,500",
      period: "سنوياً",
      cta: "ابدأ الآن",
      features: [
        "حتى 75 موظف",
        "جميع أنواع الشيفتات",
        "حساب التأخير والأوفر تايم",
        "إدارة الإجازات كاملة",
        "أرشفة وتصدير التقارير",
        "دعم فني أولوية عبر واتساب"
      ]
    },
    pricingBusiness: {
      name: "الأعمال",
      desc: "للشركات الكبيرة — حتى 200 موظف",
      amount: "7,500",
      period: "سنوياً",
      cta: "ابدأ الآن",
      features: [
        "حتى 200 موظف",
        "جميع أنواع الشيفتات",
        "حساب التأخير والأوفر تايم",
        "إدارة الإجازات كاملة",
        "أرشفة وتصدير التقارير",
        "عطلات 7 دول عربية",
        "دعم فني مخصص"
      ]
    },
    pricingEnterpriseTitle: "مؤسسات — أكثر من 200 موظف",
    pricingEnterpriseDesc: "لو شركتك فيها أكثر من 200 موظف، تواصل معنا وهنعملك عرض سعر مخصص يناسب احتياجاتك.",
    pricingEnterpriseCta: "تواصل معنا",
    ctaTitle: "جاهز تودّع الـ Excel وحسابات آخر الشهر؟",
    ctaDesc: "ابدأ تجربة مجانية النهاردة — مش هتحتاج بطاقة ائتمان، ومش هتحتاج تدريب. ارفع ملف البصمة وشوف النتيجة بنفسك.",
    ctaButton: "ابدأ تجربة مجانية",
    footerBrandDesc: "نظام SaaS عربي لحساب رواتب الموظفين — يحوّل ملفات بصمة الحضور إلى تقارير رواتب دقيقة تلقائياً.",
    footerCopyright: "© 2026 ShiftPay HR — جميع الحقوق محفوظة",
    footerTagline: "صُنع بـ ❤️ للشركات العربية"
  }
};

function mergeSiteContent(base, override) {
  return { ...base, ...override, landing: { ...base.landing, ...(override?.landing || {}) } };
}

const PHONE_COUNTRIES = [
  { code: "EG", name: "مصر", dialCode: "+20" },
  { code: "SA", name: "السعودية", dialCode: "+966" },
  { code: "AE", name: "الإمارات", dialCode: "+971" },
  { code: "KW", name: "الكويت", dialCode: "+965" },
  { code: "QA", name: "قطر", dialCode: "+974" },
  { code: "BH", name: "البحرين", dialCode: "+973" },
  { code: "OM", name: "عُمان", dialCode: "+968" }
];

const NAV_ITEMS = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "departments", label: "الأقسام", icon: Building2 },
  { id: "shifts", label: "النوبات", icon: Clock },
  { id: "employees", label: "الموظفون", icon: Users },
  { id: "attendance", label: "رفع الحضور", icon: UploadCloud },
  { id: "reports", label: "تقرير الرواتب", icon: FileSpreadsheet },
  { id: "insights", label: "تحليلات", icon: BarChart3 },
  { id: "settings", label: "الإعدادات", icon: Settings }
];

function getShiftCopy(countryCode) {
  const isEgypt = countryCode === "EG";
  return {
    singular: isEgypt ? "شيفت" : "نوبة",
    definite: isEgypt ? "الشيفت" : "النوبة",
    plural: isEgypt ? "الشيفتات" : "النوبات"
  };
}

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    if (window.location.hash === "#site-admin" || window.location.hash === "#admin") return "site-admin";
    const hash = window.location.hash.replace("#", "");
    const appViews = ["dashboard","departments","shifts","employees","attendance","reports","archive","insights","settings"];
    if (appViews.includes(hash)) return hash;
    return "landing";
  });
  const [isBooting, setIsBooting] = useState(() => Boolean(getStoredSession()));
  const [authMode, setAuthMode] = useState("signup");
  const [siteAdminSession, setSiteAdminSession] = useState(null);
  const [siteAdminError, setSiteAdminError] = useState("");
  const [siteAdminLoading, setSiteAdminLoading] = useState(false);
  const [departments, setDepartments] = useLocalStorage("shiftpay.departments", []);
  const [shifts, setShifts] = useLocalStorage("shiftpay.shifts", []);
  const [employees, setEmployees] = useLocalStorage("shiftpay.employees", []);
  const [attendanceLogs, setAttendanceLogs] = useLocalStorage(
    "shiftpay.attendanceLogs",
    defaultAttendance
  );
  const [settings, setSettings] = useLocalStorage("shiftpay.settings", DEFAULT_SETTINGS);
  const [siteContent, setSiteContent] = useLocalStorage("shiftpay.siteContent", DEFAULT_SITE_CONTENT);
  const [reports, setReports] = useLocalStorage("shiftpay.reports", defaultReports);
  const [selectedReportId, setSelectedReportId] = useLocalStorage(
    "shiftpay.selectedReportId",
    ""
  );
  const [reportMonth, setReportMonth] = useLocalStorage("shiftpay.reportMonth", CURRENT_MONTH);
  const [notice, setNotice] = useState("");
  const [syncStatus, setSyncStatus] = useState(""); // "saving" | "saved" | "error" | ""
  const [uploadState, setUploadState] = useState({ loading: false, summary: null });
  const [selectedSlipCode, setSelectedSlipCode] = useState("");
  const [exporting, setExporting] = useState("");
  const [reportExportRows, setReportExportRows] = useState(null);
  const [cloud, setCloud] = useState(() => ({
    configured: getSupabaseConfig().isConfigured,
    session: getStoredSession(),
    user: getStoredSession()?.user || null,
    companies: [],
    companyId: localStorage.getItem("shiftpay.cloud.companyId") || "",
    auditLogs: [],
    payrollSnapshots: [],
    loading: false,
    error: "",
    lastSyncAt: ""
  }));
  const shiftCopy = useMemo(() => getShiftCopy(settings.country), [settings.country]);
  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) =>
        item.id === "shifts" ? { ...item, label: shiftCopy.plural } : item
      ),
    [shiftCopy.plural]
  );

  const selectedReport = reports.find((report) => report.id === selectedReportId) || reports[0];
  const activeAttendanceLogs =
    selectedReport?.logs?.length > 0 ? selectedReport.logs : attendanceLogs;
  const activeReportMonth = reportMonth || selectedReport?.month || getReportMonth(activeAttendanceLogs);
  const monthLabel = getMonthLabel(activeReportMonth);
  const payrollRows = useMemo(
    () =>
      calculatePayroll({
        employees,
        departments,
        shifts,
        attendanceLogs: activeAttendanceLogs,
        settings,
        reportMonth: activeReportMonth,
        incompletePunchMode: selectedReport?.incompletePunchMode || "manual"
      }),
    [employees, departments, shifts, activeAttendanceLogs, settings, activeReportMonth, selectedReport]
  );
  const selectedSlip = payrollRows.find((row) => row.employeeCode === selectedSlipCode) || payrollRows[0];
  const activeNavLabel = navItems.find((item) => item.id === activeView)?.label || monthLabel;

  const reportExportRef = useRef(null);
  const slipExportRef = useRef(null);

  const metrics = useMemo(() => {
    const activeEmployees = employees.filter((employee) => employee.active).length;
    const totalNetSalary = payrollRows.reduce((sum, row) => sum + row.netSalary, 0);
    const totalDeductions = payrollRows.reduce((sum, row) => sum + row.deductions, 0);
    const lateMinutes = payrollRows.reduce((sum, row) => sum + row.lateMinutes, 0);
    const absenceDays = payrollRows.reduce((sum, row) => sum + row.absenceDays, 0);
    const overtimeMinutes = payrollRows.reduce((sum, row) => sum + row.overtimeMinutes, 0);
    const overtimeBonuses = payrollRows.reduce((sum, row) => sum + row.overtimeBonuses, 0);

    return {
      activeEmployees,
      totalNetSalary,
      totalDeductions,
      lateMinutes,
      absenceDays,
      overtimeMinutes,
      overtimeBonuses
    };
  }, [employees, payrollRows]);

  useEffect(() => {
    const syncAdminHash = () => {
      if (window.location.hash === "#site-admin" || window.location.hash === "#admin") setActiveView("site-admin");
    };
    syncAdminHash();
    window.addEventListener("hashchange", syncAdminHash);
    return () => window.removeEventListener("hashchange", syncAdminHash);
  }, []);


  useEffect(() => {
    const rawSession = localStorage.getItem("shiftpay.siteAdminSession");
    if (!rawSession) return;
    try {
      const savedSession = JSON.parse(rawSession);
      if (savedSession?.localAdmin && savedSession?.user?.email === SITE_ADMIN_EMAIL) {
        setSiteAdminSession(savedSession);
      }
    } catch {
      localStorage.removeItem("shiftpay.siteAdminSession");
    }
  }, []);

  useEffect(() => {
    if (!cloud.configured) return;
    let mounted = true;
    loadPublicSiteContent()
      .then((content) => {
        if (mounted && content) setSiteContent(mergeSiteContent(DEFAULT_SITE_CONTENT, content));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [cloud.configured, setSiteContent]);

  useEffect(() => {
    if (!cloud.configured) {
      setIsBooting(false);
      return;
    }
    const startCloud = async () => {
      try {
        const appViews = ["dashboard","departments","shifts","employees","attendance","reports","archive","insights","settings"];
        const savedHash = window.location.hash.replace("#", "");
        const oauthSession = await consumeOAuthSessionFromUrl();
        const session = oauthSession || cloud.session;
        if (session?.access_token) {
          const connected = await bootstrapCloud(session, { silent: !oauthSession });
          if (connected) {
            setActiveView(appViews.includes(savedHash) ? savedHash : "dashboard");
          }
        }
      } catch (error) {
        setCloud((previous) => ({ ...previous, error: error.message }));
        setAuthMode("signin");
        setActiveView("auth");
      } finally {
        setIsBooting(false);
      }
    };
    startCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cloud.session || !cloud.companyId || cloud.loading) return;
    if (!employees.length && !departments.length && !shifts.length) return;
    setSyncStatus("saving");
    const timer = setTimeout(async () => {
      try {
        let session = cloud.session;
        if (!session?.access_token) {
          setSyncStatus("error");
          return;
        }
        if (isSessionExpired(session)) {
          const refreshed = await refreshSession(session);
          if (!refreshed) {
            setCloud((prev) => ({ ...prev, session: null }));
            storeSession(null);
            setNotice("انتهت جلسة تسجيل دخولك، سجل دخول مجددًا.");
            setActiveView("auth");
            setSyncStatus("error");
            return;
          }
          session = refreshed;
          setCloud((prev) => ({ ...prev, session: refreshed }));
          storeSession(refreshed);
        }
        await syncWorkspaceToCloud({
          session,
          companyId: cloud.companyId,
          settings,
          departments,
          shifts,
          employees,
          reports,
          payrollRows,
          reportMonth: activeReportMonth
        });
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus(""), 3000);
      } catch (err) {
        console.error("Sync error:", err?.message || err);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus(""), 5000);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [employees, departments, shifts, settings, reports, cloud.session, cloud.companyId, cloud.loading]);

  const resetWorkspaceState = (nextSettings = settings) => {
    setSettings({ ...DEFAULT_SETTINGS, ...nextSettings });
    setDepartments([]);
    setShifts([]);
    setEmployees([]);
    setAttendanceLogs([]);
    setReports([]);
    setSelectedReportId("");
    setReportMonth(CURRENT_MONTH);
    setSelectedSlipCode("");
  };

  const applyWorkspace = (workspace, company) => {
    const nextSettings = { ...DEFAULT_SETTINGS, ...settings, ...(company?.settings || {}), ...(workspace.settings || {}) };
    setSettings(nextSettings);
    // Only overwrite local data if cloud actually returned data — never replace with empty arrays
    if (workspace.departments?.length > 0) setDepartments(workspace.departments);
    if (workspace.shifts?.length > 0) setShifts(workspace.shifts);
    if (workspace.employees?.length > 0) setEmployees(workspace.employees);
    if (workspace.reports?.length > 0) {
      setReports(workspace.reports);
      setAttendanceLogs(workspace.reports[0]?.logs || []);
      setSelectedReportId(workspace.reports[0]?.id || "");
      setReportMonth(workspace.reports[0]?.month || CURRENT_MONTH);
    }
    setSelectedSlipCode("");
  };

  const bootstrapCloud = async (session, options = {}) => {
    setCloud((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const user = session.user || (await getCurrentUser(session));
      const sessionWithUser = { ...session, user };
      const seedCountry = user?.user_metadata?.phone_country || settings.country || DEFAULT_SETTINGS.country;
      const seedCountryProfile = getCountryProfile(seedCountry);
      const companySeedSettings = {
        ...DEFAULT_SETTINGS,
        companyName: user?.user_metadata?.company_name || settings.companyName || DEFAULT_SETTINGS.companyName,
        country: seedCountryProfile.code,
        currency: seedCountryProfile.currency,
        workDays: seedCountryProfile.workDays,
        weekends: seedCountryProfile.weekends
      };
      const company = await ensureCloudCompany(sessionWithUser, companySeedSettings);
      const companies = await listCloudCompanies(sessionWithUser);
      const workspace = await loadWorkspaceFromCloud(sessionWithUser, company.id);
      applyWorkspace(workspace, company);
      setCloud((previous) => ({
        ...previous,
        session: sessionWithUser,
        user,
        companies,
        companyId: company.id,
        auditLogs: workspace.auditLogs || [],
        payrollSnapshots: workspace.payrollSnapshots || [],
        loading: false,
        lastSyncAt: new Date().toISOString()
      }));
      localStorage.setItem("shiftpay.cloud.companyId", company.id);
      if (!options.silent) setNotice("تم الاتصال بالسحابة وتحميل بيانات الشركة.");
      return true;
    } catch (error) {
      setCloud((previous) => ({ ...previous, loading: false, error: error.message }));
      return false;
    }
  };

  const handleCloudLogin = async ({ mode, email, password, companyName, phoneCountry, phone }) => {
    setCloud((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const session =
        mode === "signup"
          ? await signUpWithEmail({ email, password, companyName, phoneCountry, phone })
          : await signInWithEmail({ email, password });
      if (!session?.access_token) {
        setCloud((previous) => ({
          ...previous,
          loading: false,
          error: "تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده ثم سجل الدخول."
        }));
        return;
      }
      const connected = await bootstrapCloud(session);
      if (connected) setActiveView("dashboard");
    } catch (error) {
      setCloud((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  };

  const handleGoogleLogin = () => {
    try {
      signInWithGoogle();
    } catch (error) {
      setCloud((previous) => ({ ...previous, error: error.message }));
    }
  };

  const handleCloudLogout = async () => {
    try {
      await signOut(cloud.session);
    } catch {
      // Ignore network errors — always clear local session
    } finally {
      storeSession(null);
      localStorage.removeItem("shiftpay.cloud.companyId");
      setCloud((previous) => ({
        ...previous,
        session: null,
        user: null,
        companies: [],
        companyId: "",
        auditLogs: [],
        payrollSnapshots: [],
        error: "",
        lastSyncAt: ""
      }));
      resetWorkspaceState();
      setNotice("تم تسجيل الخروج من السحابة. البيانات المحلية ما زالت محفوظة.");
      setActiveView("landing");
    }
  };

  const handleCloudSync = async () => {
    if (!cloud.session || !cloud.companyId) return;
    if (isSessionExpired(cloud.session)) {
      await handleCloudLogout();
      setNotice("انتهت جلسة تسجيل دخولك، سجل دخول مجددًا.");
      setActiveView("auth");
      return;
    }
    setCloud((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      await syncWorkspaceToCloud({
        session: cloud.session,
        companyId: cloud.companyId,
        settings,
        departments,
        shifts,
        employees,
        reports,
        payrollRows,
        reportMonth: activeReportMonth
      });
      const workspace = await loadWorkspaceFromCloud(cloud.session, cloud.companyId);
      setCloud((previous) => ({
        ...previous,
        loading: false,
        auditLogs: workspace.auditLogs || [],
        payrollSnapshots: workspace.payrollSnapshots || [],
        lastSyncAt: new Date().toISOString()
      }));
      setNotice("تم حفظ البيانات على السحابة.");
    } catch (error) {
      setCloud((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  };

  const handleCloudLoad = async (companyId = cloud.companyId) => {
    if (!cloud.session || !companyId) return;
    if (isSessionExpired(cloud.session)) {
      await handleCloudLogout();
      setNotice("انتهت جلسة تسجيل دخولك، سجل دخول مجددًا.");
      setActiveView("auth");
      return;
    }
    setCloud((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const workspace = await loadWorkspaceFromCloud(cloud.session, companyId);
      applyWorkspace(workspace);
      setCloud((previous) => ({
        ...previous,
        companyId,
        loading: false,
        auditLogs: workspace.auditLogs || [],
        payrollSnapshots: workspace.payrollSnapshots || [],
        lastSyncAt: new Date().toISOString()
      }));
      setNotice("تم تحميل بيانات الشركة من السحابة.");
    } catch (error) {
      setCloud((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  };

  const handleSiteContentSave = async (session = cloud.session) => {
    if (!session) {
      setNotice("سجل الدخول أولا لحفظ إعدادات الموقع.");
      return;
    }

    setCloud((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const saved = await savePublicSiteContent(session.localAdmin ? null : session, siteContent);
      setSiteContent(mergeSiteContent(DEFAULT_SITE_CONTENT, saved));
      setCloud((previous) => ({ ...previous, loading: false }));
      setNotice("تم حفظ محتوى الصفحة الرئيسية وبيانات الدعم على اللايف.");
    } catch (error) {
      setCloud((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  };

  const handleSiteAdminLogin = async ({ email, password }) => {
    if (!SITE_ADMIN_PASSWORD) {
      setSiteAdminError("اضبط VITE_SITE_ADMIN_PASSWORD في إعدادات الـ Vercel.");
      return;
    }

    setSiteAdminLoading(true);
    setSiteAdminError("");

    const normalizedInput = (email || "").trim().toLowerCase();
    const normalizedPassword = (password || "").trim();

    const emailMatch = SITE_ADMIN_EMAIL && normalizedInput === SITE_ADMIN_EMAIL;
    const usernameMatch = normalizedInput === SITE_ADMIN_USERNAME;

    if ((emailMatch || usernameMatch) && normalizedPassword === SITE_ADMIN_PASSWORD) {
      const session = {
        localAdmin: true,
        user: {
          id: "site-admin",
          email: normalizedInput,
          role: "site-admin"
        }
      };
      setSiteAdminSession(session);
      localStorage.setItem("shiftpay.siteAdminSession", JSON.stringify(session));
    } else {
      setSiteAdminError("اسم المستخدم أو كلمة المرور غلط");
    }

    setSiteAdminLoading(false);
  };

  const handleSiteAdminLogout = async () => {
    if (siteAdminSession && !siteAdminSession.localAdmin) {
      try {
        await signOut(siteAdminSession);
      } catch {
        // Ignore remote logout errors so the local UI can always reset.
      }
    }
    localStorage.removeItem("shiftpay.siteAdminSession");
    setSiteAdminSession(null);
    setSiteAdminError("");
  };

  const navigate = (view) => {
    setActiveView(view);
    const appViews = ["dashboard","departments","shifts","employees","attendance","reports","archive","insights","settings"];
    if (view === "site-admin") {
      window.location.hash = "site-admin";
    } else if (appViews.includes(view)) {
      window.location.hash = view;
    } else {
      window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAuth = (mode = "signup") => {
    setAuthMode(mode);
    navigate("auth");
  };

  const handleExcelExport = async (rows = payrollRows) => {
    setExporting("excel");
    await exportPayrollToXlsx({
      rows,
      companyName: settings.companyName,
      monthLabel,
      currency: settings.currency,
      shiftLabel: shiftCopy.definite
    });
    setExporting("");
  };

  const handleBankTransferExport = async (rows = payrollRows) => {
    setExporting("bank");
    await exportBankTransferSheet({
      rows,
      companyName: settings.companyName,
      monthLabel,
      currency: settings.currency
    });
    setExporting("");
  };

  const handleAccountingExport = async (rows = payrollRows) => {
    setExporting("accounting");
    await exportAccountingJournal({
      rows,
      companyName: settings.companyName,
      monthLabel,
      currency: settings.currency
    });
    setExporting("");
  };

  const handleReportPdf = async (rows = payrollRows) => {
    setExporting("report");
    setReportExportRows(rows);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await exportElementToPdf(reportExportRef.current, `ShiftPay-HR-${monthLabel}.pdf`);
    setReportExportRows(null);
    setExporting("");
  };

  const handleSlipPdf = async () => {
    if (!selectedSlip) return;
    setExporting("slip");
    await exportElementToPdf(slipExportRef.current, `Salary-Slip-${selectedSlip.employeeCode}.pdf`);
    setExporting("");
  };

  const handleBackupExport = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      departments,
      shifts,
      employees,
      attendanceLogs,
      reports,
      reportMonth,
      siteContent
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShiftPay-HR-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("تم تحميل نسخة احتياطية من بيانات النظام.");
  };

  const handleBackupImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result || "{}"));
        if (backup.settings) setSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
        if (Array.isArray(backup.departments)) setDepartments(backup.departments);
        if (Array.isArray(backup.shifts)) setShifts(backup.shifts);
        if (Array.isArray(backup.employees)) setEmployees(backup.employees);
        if (Array.isArray(backup.attendanceLogs)) setAttendanceLogs(backup.attendanceLogs);
        if (Array.isArray(backup.reports)) setReports(backup.reports);
        if (backup.reportMonth) setReportMonth(backup.reportMonth);
        if (backup.siteContent) setSiteContent(mergeSiteContent(DEFAULT_SITE_CONTENT, backup.siteContent));
        setNotice("تم استرجاع النسخة الاحتياطية بنجاح.");
      } catch {
        setNotice("ملف النسخة الاحتياطية غير صالح.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const view = {
    dashboard: (
      <DashboardView
        metrics={metrics}
        departments={departments}
        shifts={shifts}
        shiftCopy={shiftCopy}
        reports={reports}
        payrollRows={payrollRows}
        monthLabel={monthLabel}
        reportMonth={activeReportMonth}
        settings={settings}
        onNavigate={navigate}
      />
    ),
    departments: (
      <DepartmentsView
        departments={departments}
        setDepartments={setDepartments}
        setNotice={setNotice}
      />
    ),
    shifts: <ShiftsView shifts={shifts} setShifts={setShifts} setNotice={setNotice} shiftCopy={shiftCopy} />,
    employees: (
      <EmployeesView
        employees={employees}
        setEmployees={setEmployees}
        departments={departments}
        shifts={shifts}
        shiftCopy={shiftCopy}
        setNotice={setNotice}
      />
    ),
    attendance: (
      <AttendanceView
        uploadState={uploadState}
        setUploadState={setUploadState}
        employees={employees}
        setEmployees={setEmployees}
        departments={departments}
        shifts={shifts}
        settings={settings}
        reports={reports}
        setAttendanceLogs={setAttendanceLogs}
        setReports={setReports}
        setSelectedReportId={setSelectedReportId}
        setReportMonth={setReportMonth}
        setNotice={setNotice}
        onReport={() => navigate("reports")}
      />
    ),
    insights: (
      <InsightsView
        payrollRows={payrollRows}
        employees={employees}
        departments={departments}
        monthLabel={monthLabel}
        settings={settings}
      />
    ),
    archive: (
      <ArchiveView
        reports={reports}
        onNavigate={navigate}
        onSelectReport={(report) => {
          setSelectedReportId(report.id);
          if (report.month) setReportMonth(report.month);
          navigate("reports");
        }}
        getMonthLabel={getMonthLabel}
      />
    ),
    reports: (
      <ReportsView
        payrollRows={payrollRows}
        reports={reports}
        setReports={setReports}
        departments={departments}
        selectedReportId={selectedReport?.id || ""}
        setSelectedReportId={setSelectedReportId}
        reportMonth={activeReportMonth}
        setReportMonth={setReportMonth}
        monthLabel={monthLabel}
        settings={settings}
        selectedSlip={selectedSlip}
        setSelectedSlipCode={setSelectedSlipCode}
        onExcel={handleExcelExport}
        onBankTransfer={handleBankTransferExport}
        onAccounting={handleAccountingExport}
        onPdf={handleReportPdf}
        onSlipPdf={handleSlipPdf}
        exporting={exporting}
        shiftCopy={shiftCopy}
        setNotice={setNotice}
        onNavigate={navigate}
      />
    ),
    settings: (
      <SettingsView
        settings={settings}
        setSettings={setSettings}
        setNotice={setNotice}
        cloud={cloud}
        onCloudLogin={handleCloudLogin}
        onGoogleLogin={handleGoogleLogin}
        onCloudLogout={handleCloudLogout}
        onCloudSync={handleCloudSync}
        onCloudLoad={handleCloudLoad}
        onBackupExport={handleBackupExport}
        onBackupImport={handleBackupImport}
      />
    )
  }[activeView];

  // Show loading screen while checking stored session to prevent flash
  if (isBooting) {
    return (
      <div className="flex h-screen items-center justify-center bg-cloud">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (activeView === "site-admin") {
    return (
      <SiteAdminPage
        siteContent={siteContent}
        setSiteContent={setSiteContent}
        session={siteAdminSession}
        error={siteAdminError}
        loading={siteAdminLoading || cloud.loading}
        onLogin={handleSiteAdminLogin}
        onLogout={handleSiteAdminLogout}
        onSave={() => handleSiteContentSave(siteAdminSession)}
        onLanding={() => navigate("landing")}
        notice={notice}
        setNotice={setNotice}
      />
    );
  }

  if (!cloud.session && activeView === "auth") {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        siteContent={siteContent}
        cloud={cloud}
        onLogin={handleCloudLogin}
        onGoogleLogin={handleGoogleLogin}
        onLanding={() => navigate("landing")}
      />
    );
  }

  if (activeView === "landing") {
    return (
      <PublicHomePage
        siteContent={siteContent}
        isAuthenticated={Boolean(cloud.session)}
        onSignup={() => openAuth("signup")}
        onSignin={() => openAuth("signin")}
        onLogout={handleCloudLogout}
        onEnter={() => navigate("dashboard")}
      />
    );
  }

  if (!cloud.session) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        siteContent={siteContent}
        cloud={cloud}
        onLogin={handleCloudLogin}
        onGoogleLogin={handleGoogleLogin}
        onLanding={() => navigate("landing")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cloud">
      <aside className="hidden border-l border-line bg-white/95 lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:justify-between lg:px-5 lg:py-6">
        <div>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-right"
            onClick={() => navigate("landing")}
          >
            <LogoMark />
            <div>
              <p className="text-lg font-extrabold text-ink">ShiftPay HR</p>
              <p className="text-xs font-medium text-slate-500">رواتب الحضور الذكية</p>
            </div>
          </button>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={() => navigate(item.id)}
              />
            ))}
          </nav>
        </div>
        <CloudMiniStatus cloud={cloud} onNavigate={() => navigate("settings")} />
      </aside>

      <div className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <button className="flex items-center gap-2" type="button" onClick={() => navigate("landing")}>
            <LogoMark />
            <span className="font-extrabold text-ink">ShiftPay HR</span>
          </button>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">
            {activeNavLabel}
          </span>
        </div>
        <nav className="dashboard-scroll flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${
                activeView === item.id
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-slate-600"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="lg:pr-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {activeView !== "settings" ? (
            <CloudTopBar
              cloud={cloud}
              onSync={handleCloudSync}
              onLogout={handleCloudLogout}
              onNavigate={() => navigate("settings")}
            />
          ) : null}
          {syncStatus ? (
            <div
              className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-2xl transition-all duration-300 ease-out ${
                syncStatus === "saving"
                  ? "bg-blue-600"
                  : syncStatus === "saved"
                    ? "bg-emerald-600"
                    : "bg-rose-600"
              } translate-y-0 opacity-100`}
            >
              {syncStatus === "saving" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  <span>جاري الحفظ...</span>
                </>
              ) : syncStatus === "saved" ? (
                <span>تم الحفظ ✓</span>
              ) : (
                <span>فشل الحفظ ✗</span>
              )}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} className="text-emerald-900">
                إغلاق
              </button>
            </div>
          ) : null}
          {view}
        </div>
      </main>

      <ReportExportSurface
        refTarget={reportExportRef}
        rows={reportExportRows || payrollRows}
        settings={settings}
        monthLabel={monthLabel}
        shiftCopy={shiftCopy}
      />
      <div ref={slipExportRef} className="export-surface export-surface-a4" data-pdf-orientation="portrait">
        {selectedSlip ? (
          <SalarySlip row={selectedSlip} settings={settings} monthLabel={monthLabel} shiftCopy={shiftCopy} exportMode />
        ) : null}
      </div>
    </div>
  );
}

const LANDING_CSS = `
/* ===========================
   ShiftPay HR — Design System
   =========================== */

/* ---------- Fonts ---------- */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

/* ---------- CSS Variables ---------- */
:root {
  /* Colors */
  --color-primary: #1F4E79;
  --color-primary-light: #2A6BAA;
  --color-primary-dark: #163A5C;
  --color-primary-50: #EBF3FA;
  --color-primary-100: #D1E4F3;
  --color-primary-200: #A3C9E7;

  --color-bg: #F8FAFC;
  --color-bg-white: #FFFFFF;
  --color-bg-subtle: #F1F5F9;
  --color-bg-muted: #E2E8F0;

  --color-text: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-text-on-primary: #FFFFFF;

  --color-success: #059669;
  --color-success-bg: #ECFDF5;
  --color-danger: #DC2626;
  --color-danger-bg: #FEF2F2;

  --color-border: #E2E8F0;
  --color-border-light: #F1F5F9;

  /* Typography */
  --font-family: 'Cairo', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  --font-size-6xl: 3.75rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  --line-height-tight: 1.3;
  --line-height-normal: 1.7;
  --line-height-relaxed: 1.9;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* Borders */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  --shadow-card-hover: 0 20px 40px -8px rgba(31, 78, 121, 0.12);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Layout */
  --container-max: 1200px;
  --nav-height: 72px;
}

/* ---------- Reset & Base ---------- */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  background-color: var(--color-bg);
  direction: rtl;
  text-align: right;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

img {
  max-width: 100%;
  display: block;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color var(--transition-fast);
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

ul, ol {
  list-style: none;
}

/* ---------- Utilities ---------- */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.section {
  padding: var(--space-24) 0;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-50);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  border: 1px solid var(--color-primary-100);
}

.section-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.section-desc {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
}

.text-center {
  text-align: center;
}

.text-center .section-desc {
  margin: 0 auto;
}

/* ---------- Scroll Animations ---------- */
.fade-up {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-up-delay-1 { transition-delay: 80ms; }
.fade-up-delay-2 { transition-delay: 160ms; }
.fade-up-delay-3 { transition-delay: 240ms; }
.fade-up-delay-4 { transition-delay: 320ms; }
.fade-up-delay-5 { transition-delay: 400ms; }

/* ===========================
   Navigation
   =========================== */
.navbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: var(--nav-height);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border-light);
  z-index: 1000;
  transition: box-shadow var(--transition-base);
}

.navbar.scrolled {
  box-shadow: var(--shadow-sm);
  border-bottom-color: var(--color-border);
}

.navbar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-logo {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.nav-brand-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  letter-spacing: -0.01em;
}

.nav-brand-text span {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.nav-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  right: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link:hover::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: 0 1px 3px rgba(31, 78, 121, 0.3);
}

.btn-primary:hover {
  background: var(--color-primary-light);
  box-shadow: 0 4px 12px rgba(31, 78, 121, 0.35);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.btn-large {
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-base);
  border-radius: var(--radius-xl);
}

.btn-white {
  background: white;
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Mobile menu */
.nav-mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: var(--space-2);
  cursor: pointer;
}

.nav-mobile-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.nav-mobile-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 6px);
}
.nav-mobile-toggle.active span:nth-child(2) {
  opacity: 0;
}
.nav-mobile-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -6px);
}

/* ===========================
   Hero Section
   =========================== */
.hero {
  padding-top: calc(var(--nav-height) + var(--space-20));
  padding-bottom: var(--space-20);
  background: linear-gradient(175deg, #FFFFFF 0%, #F0F6FC 50%, var(--color-bg) 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -40%;
  left: -20%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(31, 78, 121, 0.04) 0%, transparent 70%);
  pointer-events: none;
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: var(--space-16);
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--space-8);
}

.hero-badge svg {
  width: 16px;
  height: 16px;
}

.hero-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  color: var(--color-text);
  margin-bottom: var(--space-6);
  letter-spacing: -0.01em;
}

.hero-title .highlight {
  color: var(--color-primary);
  position: relative;
}

.hero-desc {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-10);
  max-width: 520px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}

.hero-trust {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.hero-trust svg {
  width: 18px;
  height: 18px;
  color: var(--color-success);
}

.hero-trust-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hero-trust-divider {
  width: 1px;
  height: 16px;
  background: var(--color-border);
}

/* Dashboard Preview */
.hero-visual {
  position: relative;
  z-index: 1;
}

.dashboard-preview {
  background: var(--color-bg-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.dashboard-topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dashboard-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dashboard-dot.green { background: var(--color-success); }
.dashboard-dot.yellow { background: #F59E0B; }
.dashboard-dot.red { background: var(--color-danger); }

.dashboard-topbar-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.dashboard-topbar-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dashboard-body {
  padding: var(--space-5);
}

/* Dashboard KPI Row */
.dashboard-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
}

.kpi-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.kpi-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.kpi-value.success { color: var(--color-success); }
.kpi-value.danger { color: var(--color-danger); }

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

/* Dashboard Table */
.dashboard-table {
  width: 100%;
  border-collapse: collapse;
}

.dashboard-table th {
  text-align: right;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.dashboard-table td {
  font-size: var(--font-size-sm);
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text);
}

.dashboard-table tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.status-badge.on-time {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.late {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ===========================
   Before / After Section
   =========================== */
.comparison {
  background: var(--color-bg-white);
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-8);
  align-items: stretch;
}

.comparison-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.comparison-column-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  border-bottom: 2px solid var(--color-border-light);
}

.comparison-column-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-column.old .comparison-column-icon {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.comparison-column.new .comparison-column-icon {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.comparison-column-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.comparison-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg);
  transition: all var(--transition-base);
}

.comparison-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.comparison-card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.old .comparison-card-icon {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.new .comparison-card-icon {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.comparison-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-1);
}

.comparison-card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.comparison-divider {
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-arrow {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(31, 78, 121, 0.3);
}

/* ===========================
   Features Section
   =========================== */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  margin-top: var(--space-12);
}

.feature-card {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-white);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-primary-200);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
  transition: all var(--transition-base);
}

.feature-card:hover .feature-icon {
  background: var(--color-primary);
  color: white;
}

.feature-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
  color: var(--color-text);
}

.feature-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ===========================
   Pricing Section
   =========================== */
.pricing {
  background: var(--color-bg-white);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  margin-top: var(--space-12);
}

.pricing-card {
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-white);
  transition: all var(--transition-base);
  position: relative;
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.pricing-card.popular {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-xl);
}

.pricing-card.popular:hover {
  box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-2xl);
}

.pricing-popular-badge {
  position: absolute;
  top: -14px;
  right: 50%;
  transform: translateX(50%);
  background: var(--color-primary);
  color: white;
  padding: var(--space-1) var(--space-5);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.pricing-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.pricing-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

.pricing-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.pricing-amount {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
  line-height: 1;
}

.pricing-currency {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.pricing-period {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-8);
}

.pricing-features {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.pricing-feature {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.pricing-feature svg {
  width: 18px;
  height: 18px;
  color: var(--color-success);
  flex-shrink: 0;
}

.pricing-card .btn {
  width: 100%;
}

/* Enterprise Card */
.pricing-enterprise {
  margin-top: var(--space-6);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.pricing-enterprise-info {
  flex: 1;
}

.pricing-enterprise-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.pricing-enterprise-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ===========================
   Final CTA Section
   =========================== */
.cta-section {
  background: var(--color-primary);
  padding: var(--space-20) 0;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -25%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  pointer-events: none;
}

.cta-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  right: -15%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  pointer-events: none;
}

.cta-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: white;
  margin-bottom: var(--space-5);
  line-height: var(--line-height-tight);
}

.cta-desc {
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-10);
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
}

/* ===========================
   Footer
   =========================== */
.footer {
  background: var(--color-text);
  color: rgba(255, 255, 255, 0.7);
  padding: var(--space-16) 0 var(--space-8);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: var(--space-12);
  margin-bottom: var(--space-12);
}

.footer-brand-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin-top: var(--space-4);
  color: rgba(255, 255, 255, 0.5);
}

.footer-col-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: white;
  margin-bottom: var(--space-5);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-link {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.5);
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.footer-link:hover {
  color: white;
}

.footer-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: var(--space-3);
  transition: color var(--transition-fast);
}

.footer-contact-item:hover {
  color: white;
}

.footer-contact-item svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.footer-contact-item.whatsapp svg {
  color: #25D366;
}

.footer-divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: var(--space-8);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.35);
}

/* ===========================
   Responsive Design
   =========================== */
@media (max-width: 1024px) {
  .hero .container {
    grid-template-columns: 1fr;
    gap: var(--space-12);
  }

  .hero-title {
    font-size: var(--font-size-4xl);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pricing-grid .pricing-card:last-child {
    grid-column: 1 / -1;
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .comparison-divider {
    display: none;
  }

  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  :root {
    --nav-height: 64px;
  }

  .nav-links {
    display: none;
    position: absolute;
    top: var(--nav-height);
    right: 0;
    left: 0;
    flex-direction: column;
    background: white;
    padding: var(--space-6);
    gap: var(--space-4);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
  }

  .nav-links.active {
    display: flex;
  }

  .nav-mobile-toggle {
    display: flex;
  }

  .hero {
    padding-top: calc(var(--nav-height) + var(--space-10));
    padding-bottom: var(--space-12);
  }

  .hero-title {
    font-size: var(--font-size-3xl);
  }

  .hero-desc {
    font-size: var(--font-size-base);
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-trust {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .hero-trust-divider {
    display: none;
  }

  .section {
    padding: var(--space-16) 0;
  }

  .section-title {
    font-size: var(--font-size-2xl);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-grid .pricing-card:last-child {
    max-width: none;
  }

  .pricing-enterprise {
    flex-direction: column;
    text-align: center;
  }

  .cta-title {
    font-size: var(--font-size-2xl);
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .footer-bottom {
    flex-direction: column;
    gap: var(--space-3);
    text-align: center;
  }

  .dashboard-kpis {
    grid-template-columns: 1fr;
  }

  .dashboard-table-wrap {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: var(--font-size-2xl);
  }

  .container {
    padding: 0 var(--space-4);
  }

  .feature-card {
    padding: var(--space-6);
  }

  .pricing-card {
    padding: var(--space-6);
  }
}

`;

function PublicHomePage({ siteContent, isAuthenticated, onSignup, onSignin, onLogout, onEnter }) {
  const landing = siteContent.landing || DEFAULT_SITE_CONTENT.landing;
  const rootRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryAction = isAuthenticated ? onEnter : onSignup;
  const secondaryAction = isAuthenticated ? onEnter : onSignin;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    const fadeEls = root.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    fadeEls.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToId = (id) => (event) => {
    if (event?.preventDefault) event.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const whatsappHref = `https://wa.me/${(siteContent.supportPhone || "").replace(/[^0-9]/g, "")}`;

  const renderHeroTitle = () => {
    const title = siteContent.heroTitle || "";
    const highlight = siteContent.heroHighlight;
    if (highlight && title.includes(highlight)) {
      const idx = title.indexOf(highlight);
      return (
        <>
          {title.slice(0, idx)}
          <span className="highlight">{highlight}</span>
          {title.slice(idx + highlight.length)}
        </>
      );
    }
    return title;
  };

  const pricingTiers = [landing.pricingBasic, landing.pricingPro, landing.pricingBusiness];
  const featureIcons = [Clock, AlertTriangle, TrendingUp, CalendarDays, CalendarDays, Archive];
  const navLinks = landing.navLinks || DEFAULT_SITE_CONTENT.landing.navLinks;

  return (
    <div className="spl" ref={rootRef}>
      <style>{LANDING_CSS}</style>

      <nav className={`navbar${navScrolled ? " scrolled" : ""}`}>
        <div className="container">
          <a href="#hero" className="nav-brand" onClick={scrollToId("hero")}>
            <div className="nav-logo">
              {siteContent.logo ? (
                <img
                  src={siteContent.logo}
                  alt="ShiftPay HR"
                  style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "contain" }}
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v10l4.5 4.5" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div className="nav-brand-text">
              ShiftPay <span>HR</span>
            </div>
          </a>

          <div className={`nav-links${mobileOpen ? " active" : ""}`}>
            {navLinks.map((link) => (
              <a key={link.target} href={`#${link.target}`} className="nav-link" onClick={scrollToId(link.target)}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <button type="button" className="btn btn-secondary" onClick={onLogout}>
                تسجيل خروج
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={onSignin}>
                {landing.loginCta}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={primaryAction}>
              {isAuthenticated ? "فتح النظام" : siteContent.primaryCta}
            </button>
          </div>

          <button
            type="button"
            className={`nav-mobile-toggle${mobileOpen ? " active" : ""}`}
            aria-label="فتح القائمة"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge fade-up">
              <Sparkles size={16} />
              {siteContent.heroBadge}
            </div>

            <h1 className="hero-title fade-up fade-up-delay-1">{renderHeroTitle()}</h1>

            <p className="hero-desc fade-up fade-up-delay-2">{siteContent.heroText}</p>

            <div className="hero-actions fade-up fade-up-delay-3">
              <button type="button" className="btn btn-primary btn-large" onClick={primaryAction}>
                <ArrowLeft size={18} />
                {isAuthenticated ? "فتح النظام" : siteContent.primaryCta}
              </button>
              {!isAuthenticated ? (
                <button type="button" className="btn btn-secondary btn-large" onClick={scrollToId("features")}>
                  {siteContent.secondaryCta}
                </button>
              ) : null}
            </div>

            <div className="hero-trust fade-up fade-up-delay-4">
              {(landing.heroTrust || []).map((text, index) => {
                const TrustIcon = index === 0 ? ShieldCheck : index === 1 ? Clock : CalendarDays;
                return (
                  <React.Fragment key={text}>
                    {index > 0 ? <div className="hero-trust-divider"></div> : null}
                    <div className="hero-trust-item">
                      <TrustIcon size={18} />
                      {text}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="hero-visual fade-up fade-up-delay-2">
            <div className="dashboard-preview">
              <div className="dashboard-topbar">
                <div className="dashboard-topbar-right">
                  <div className="dashboard-dot green"></div>
                  <div className="dashboard-dot yellow"></div>
                  <div className="dashboard-dot red"></div>
                  <span className="dashboard-topbar-title">لوحة تقارير الرواتب</span>
                </div>
                <span className="dashboard-topbar-date">يوليو 2026</span>
              </div>
              <div className="dashboard-body">
                <div className="dashboard-kpis">
                  <div className="kpi-card">
                    <div className="kpi-label">إجمالي الموظفين</div>
                    <div className="kpi-value">48</div>
                    <div className="kpi-sub">هذا الشهر</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">نسبة الالتزام</div>
                    <div className="kpi-value success">92%</div>
                    <div className="kpi-sub">حضور منتظم</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">حالات تأخير</div>
                    <div className="kpi-value danger">7</div>
                    <div className="kpi-sub">هذا الأسبوع</div>
                  </div>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>الموظف</th>
                        <th>الشيفت</th>
                        <th>الحضور</th>
                        <th>الانصراف</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>أحمد محمد علي</td>
                        <td>صباحي</td>
                        <td>08:02</td>
                        <td>16:05</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> ملتزم
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>سارة عبدالرحمن</td>
                        <td>مسائي</td>
                        <td>16:15</td>
                        <td>00:10</td>
                        <td>
                          <span className="status-badge late">
                            <span className="status-dot"></span> متأخر 15 د
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>محمود حسن</td>
                        <td>صباحي</td>
                        <td>07:55</td>
                        <td>17:30</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> أوفر تايم 1.5 س
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>نورا السيد</td>
                        <td>منقسم</td>
                        <td>09:00</td>
                        <td>18:00</td>
                        <td>
                          <span className="status-badge on-time">
                            <span className="status-dot"></span> ملتزم
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section comparison" id="comparison">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              {landing.comparisonBadge}
            </div>
            <h2 className="section-title">{landing.comparisonTitle}</h2>
            <p className="section-desc">{landing.comparisonDesc}</p>
          </div>

          <div className="comparison-grid" style={{ marginTop: "var(--space-12)" }}>
            <div className="comparison-column old fade-up fade-up-delay-1">
              <div className="comparison-column-header">
                <div className="comparison-column-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <span className="comparison-column-title">{landing.comparisonOldLabel}</span>
              </div>
              {(landing.comparisonOld || []).map((item) => (
                <div className="comparison-card" key={item.title}>
                  <div className="comparison-card-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="comparison-card-title">{item.title}</div>
                    <div className="comparison-card-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-divider fade-up">
              <div className="comparison-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </div>
            </div>

            <div className="comparison-column new fade-up fade-up-delay-2">
              <div className="comparison-column-header">
                <div className="comparison-column-icon">
                  <CheckCircle2 size={24} />
                </div>
                <span className="comparison-column-title">{landing.comparisonNewLabel}</span>
              </div>
              {(landing.comparisonNew || []).map((item) => (
                <div className="comparison-card" key={item.title}>
                  <div className="comparison-card-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="comparison-card-title">{item.title}</div>
                    <div className="comparison-card-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {landing.featuresBadge}
            </div>
            <h2 className="section-title">{landing.featuresTitle}</h2>
            <p className="section-desc">{landing.featuresDesc}</p>
          </div>

          <div className="features-grid">
            {(landing.features || []).map((feature, index) => {
              const FeatureIcon = featureIcons[index % featureIcons.length];
              return (
                <div className="feature-card fade-up" key={feature.title}>
                  <div className="feature-icon">
                    <FeatureIcon size={24} />
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {landing.pricingBadge}
            </div>
            <h2 className="section-title">{landing.pricingTitle}</h2>
            <p className="section-desc">{landing.pricingDesc}</p>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier, index) => (
              <div className={`pricing-card${tier?.badge ? " popular" : ""} fade-up`} key={tier?.name || index}>
                {tier?.badge ? <div className="pricing-popular-badge">{tier.badge}</div> : null}
                <div className="pricing-name">{tier?.name}</div>
                <div className="pricing-desc">{tier?.desc}</div>
                <div className="pricing-price">
                  <span className="pricing-amount">{tier?.amount}</span>
                  <span className="pricing-currency">ج.م</span>
                </div>
                <div className="pricing-period">{tier?.period}</div>
                <div className="pricing-features">
                  {(tier?.features || []).map((line) => (
                    <div className="pricing-feature" key={line}>
                      <CheckCircle2 size={18} />
                      {line}
                    </div>
                  ))}
                </div>
                <button type="button" className={`btn ${tier?.badge ? "btn-primary" : "btn-secondary"}`} onClick={primaryAction}>
                  {tier?.cta || "ابدأ الآن"}
                </button>
              </div>
            ))}
          </div>

          <div className="pricing-enterprise fade-up">
            <div className="pricing-enterprise-info">
              <div className="pricing-enterprise-title">{landing.pricingEnterpriseTitle}</div>
              <div className="pricing-enterprise-desc">{landing.pricingEnterpriseDesc}</div>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-large">
              <MessageCircle size={18} />
              {landing.pricingEnterpriseCta}
            </a>
          </div>
        </div>
      </section>

      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-content fade-up">
            <h2 className="cta-title">{landing.ctaTitle}</h2>
            <p className="cta-desc">{landing.ctaDesc}</p>
            <button type="button" className="btn btn-white btn-large" onClick={primaryAction}>
              <ArrowLeft size={18} />
              {landing.ctaButton}
            </button>
          </div>
        </div>
      </section>

      <footer className="footer" id="support">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#hero" className="nav-brand" style={{ color: "white" }} onClick={scrollToId("hero")}>
                <div className="nav-logo">
                  {siteContent.logo ? (
                    <img
                      src={siteContent.logo}
                      alt="ShiftPay HR"
                      style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "contain" }}
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v10l4.5 4.5" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="nav-brand-text" style={{ color: "white" }}>
                  ShiftPay <span style={{ color: "rgba(255,255,255,0.5)" }}>HR</span>
                </div>
              </a>
              <p className="footer-brand-desc">{landing.footerBrandDesc}</p>
            </div>

            <div>
              <div className="footer-col-title">روابط سريعة</div>
              <div className="footer-links">
                {navLinks.map((link) => (
                  <a key={link.target} href={`#${link.target}`} className="footer-link" onClick={scrollToId(link.target)}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="footer-col-title">المنتج</div>
              <div className="footer-links">
                <button type="button" className="footer-link" onClick={primaryAction}>
                  {siteContent.primaryCta}
                </button>
                <button type="button" className="footer-link" onClick={secondaryAction}>
                  {landing.loginCta}
                </button>
                <a href="#pricing" className="footer-link" onClick={scrollToId("pricing")}>
                  الباقات والأسعار
                </a>
              </div>
            </div>

            <div>
              <div className="footer-col-title">تواصل معنا</div>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="footer-contact-item whatsapp">
                <MessageCircle size={20} />
                واتساب
              </a>
              <a href={`mailto:${siteContent.supportEmail}`} className="footer-contact-item">
                <Mail size={20} />
                {siteContent.supportEmail}
              </a>
              <a href="https://shiftpay.online" target="_blank" rel="noopener noreferrer" className="footer-contact-item">
                <Headphones size={20} />
                shiftpay.online
              </a>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <span>{landing.footerCopyright}</span>
            <span>{landing.footerTagline}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InsightsView({ payrollRows, employees, departments, monthLabel, settings }) {
  const [tab, setTab] = useState("overview");

  if (!payrollRows?.length) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="التحليلات" title="تقارير متقدمة" description="ارفع ملف البصمة أولاً لعرض التحليلات." />
        <div className="rounded-lg border border-line bg-white p-12 text-center text-slate-400">
          لا توجد بيانات بعد
        </div>
      </div>
    );
  }

  // KPIs
  const totalSalary = payrollRows.reduce((s, r) => s + (r.salary || 0), 0);
  const totalNet = payrollRows.reduce((s, r) => s + (r.netSalary || 0), 0);
  const totalDeductions = payrollRows.reduce((s, r) => s + (r.deductions || 0), 0);
  const totalOT = payrollRows.reduce((s, r) => s + (r.overtimeBonuses || 0), 0);
  const totalLateMinutes = payrollRows.reduce((s, r) => s + (r.lateMinutes || 0), 0);
  const totalAbsenceDays = payrollRows.reduce((s, r) => s + (r.absenceDays || 0), 0);

  // Top late employees
  const topLate = [...payrollRows]
    .filter(r => r.lateMinutes > 0)
    .sort((a, b) => b.lateMinutes - a.lateMinutes)
    .slice(0, 5);

  // Top overtime employees
  const topOT = [...payrollRows]
    .filter(r => r.overtimeMinutes > 0)
    .sort((a, b) => b.overtimeMinutes - a.overtimeMinutes)
    .slice(0, 5);

  // Most committed (full attendance, no late)
  const committed = [...payrollRows]
    .filter(r => r.absenceDays === 0 && r.lateMinutes === 0)
    .slice(0, 5);

  // Need attention (high absence or high late)
  const needAttention = [...payrollRows]
    .filter(r => r.absenceDays >= 2 || r.lateMinutes >= 60)
    .sort((a, b) => (b.absenceDays * 480 + b.lateMinutes) - (a.absenceDays * 480 + a.lateMinutes))
    .slice(0, 5);

  // Department breakdown
  const deptMap = {};
  payrollRows.forEach(r => {
    const emp = employees.find(e => e.code === r.employeeCode);
    const dept = departments.find(d => d.id === emp?.departmentId)?.name || "غير محدد";
    if (!deptMap[dept]) deptMap[dept] = { count: 0, net: 0, late: 0, absence: 0, ot: 0 };
    deptMap[dept].count++;
    deptMap[dept].net += r.netSalary || 0;
    deptMap[dept].late += r.lateMinutes || 0;
    deptMap[dept].absence += r.absenceDays || 0;
    deptMap[dept].ot += r.overtimeMinutes || 0;
  });
  const deptRows = Object.entries(deptMap).sort((a, b) => b[1].net - a[1].net);

  const tabs = [
    { id: "overview", label: "نظرة عامة" },
    { id: "late", label: "التأخيرات" },
    { id: "overtime", label: "الأوفر تايم" },
    { id: "commitment", label: "الالتزام" },
    { id: "departments", label: "الأقسام" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التحليلات"
        title={`تقارير متقدمة — ${monthLabel}`}
        description="نظرة تفصيلية على أداء الموظفين والتكاليف."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">إجمالي الرواتب</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{totalNet.toLocaleString()} <span className="text-sm font-bold text-slate-400">{settings?.currency || "ج"}</span></p>
          <p className="mt-1 text-xs text-slate-400">من أصل {totalSalary.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">إجمالي الخصومات</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-600">{totalDeductions.toLocaleString()} <span className="text-sm font-bold text-slate-400">{settings?.currency || "ج"}</span></p>
          <p className="mt-1 text-xs text-slate-400">{totalLateMinutes.toLocaleString()} دقيقة تأخير • {totalAbsenceDays} يوم غياب</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">مكافآت الأوفر تايم</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{totalOT.toLocaleString()} <span className="text-sm font-bold text-slate-400">{settings?.currency || "ج"}</span></p>
          <p className="mt-1 text-xs text-slate-400">{topOT.length} موظف لديهم أوفر تايم</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">نسبة الالتزام</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">
            {Math.round((committed.length / payrollRows.length) * 100)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">{committed.length} من {payrollRows.length} موظف ملتزمين</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <InsightsCard title="يحتاجون متابعة" icon={AlertTriangle} color="rose">
            {needAttention.length === 0 ? <p className="text-sm text-slate-400">لا يوجد</p> : needAttention.map(r => (
              <InsightsRow key={r.employeeCode} name={r.employeeName} code={r.employeeCode}
                badge={r.absenceDays > 0 ? `${r.absenceDays} أيام غياب` : `${r.lateMinutes} د تأخير`}
                badgeColor="rose" />
            ))}
          </InsightsCard>
          <InsightsCard title="الملتزمون" icon={Award} color="emerald">
            {committed.length === 0 ? <p className="text-sm text-slate-400">لا يوجد</p> : committed.map(r => (
              <InsightsRow key={r.employeeCode} name={r.employeeName} code={r.employeeCode}
                badge="ملتزم ✓" badgeColor="emerald" />
            ))}
          </InsightsCard>
        </div>
      )}

      {tab === "late" && (
        <InsightsCard title="الأكثر تأخيراً هذا الشهر" icon={TrendingDown} color="rose">
          {topLate.length === 0 ? <p className="text-sm text-slate-400">لا توجد تأخيرات</p> : (
            <div className="space-y-3">
              {topLate.map((r, i) => (
                <div key={r.employeeCode} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-extrabold text-rose-600">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{r.employeeName}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-rose-400" style={{ width: `${Math.min(100, (r.lateMinutes / topLate[0].lateMinutes) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-rose-600">{r.lateMinutes} د</p>
                    <p className="text-xs text-slate-400">{r.lateCount} مرة</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightsCard>
      )}

      {tab === "overtime" && (
        <InsightsCard title="الأكثر أوفر تايم هذا الشهر" icon={TrendingUp} color="emerald">
          {topOT.length === 0 ? <p className="text-sm text-slate-400">لا يوجد أوفر تايم</p> : (
            <div className="space-y-3">
              {topOT.map((r, i) => (
                <div key={r.employeeCode} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-extrabold text-emerald-600">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{r.employeeName}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (r.overtimeMinutes / topOT[0].overtimeMinutes) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-600">{Math.round(r.overtimeMinutes / 60 * 10) / 10} ساعة</p>
                    <p className="text-xs text-slate-400">{r.overtimeBonuses.toLocaleString()} {settings?.currency || "ج"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightsCard>
      )}

      {tab === "commitment" && (
        <div className="grid gap-4 md:grid-cols-2">
          <InsightsCard title="الملتزمون — حضور كامل بدون تأخير" icon={Award} color="emerald">
            {committed.length === 0 ? <p className="text-sm text-slate-400">لا يوجد</p> : committed.map(r => (
              <InsightsRow key={r.employeeCode} name={r.employeeName} code={r.employeeCode}
                badge={`${r.presentDays} يوم حضور`} badgeColor="emerald" />
            ))}
          </InsightsCard>
          <InsightsCard title="يحتاجون متابعة" icon={AlertTriangle} color="rose">
            {needAttention.length === 0 ? <p className="text-sm text-slate-400">لا يوجد</p> : needAttention.map(r => (
              <InsightsRow key={r.employeeCode} name={r.employeeName} code={r.employeeCode}
                badge={r.absenceDays >= 2 ? `${r.absenceDays} أيام غياب` : `${r.lateMinutes} د تأخير`}
                badgeColor="rose" />
            ))}
          </InsightsCard>
        </div>
      )}

      {tab === "departments" && (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3 text-right">القسم</th>
                <th className="px-4 py-3 text-center">الموظفون</th>
                <th className="px-4 py-3 text-center">إجمالي الرواتب</th>
                <th className="px-4 py-3 text-center">دقائق التأخير</th>
                <th className="px-4 py-3 text-center">أيام الغياب</th>
                <th className="px-4 py-3 text-center">أوفر تايم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {deptRows.map(([dept, data]) => (
                <tr key={dept} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-ink">{dept}</td>
                  <td className="px-4 py-3 text-center">{data.count}</td>
                  <td className="px-4 py-3 text-center font-bold">{data.net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-rose-600">{data.late}</td>
                  <td className="px-4 py-3 text-center text-rose-600">{data.absence}</td>
                  <td className="px-4 py-3 text-center text-emerald-600">{Math.round(data.ot / 60 * 10) / 10} ساعة</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InsightsCard({ title, icon: Icon, color, children }) {
  const colors = {
    rose: "text-rose-500",
    emerald: "text-emerald-500",
    blue: "text-primary",
  };
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={colors[color] || "text-primary"} />
        <h3 className="font-extrabold text-ink">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InsightsRow({ name, code, badge, badgeColor }) {
  const colors = {
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-ink">{name}</p>
        <p className="text-xs text-slate-400">{code}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[badgeColor] || "bg-slate-100 text-slate-600"}`}>
        {badge}
      </span>
    </div>
  );
}

function ArchiveView({ reports, onNavigate, onSelectReport, getMonthLabel }) {
  const [search, setSearch] = useState("");

  const filtered = reports.filter((r) =>
    !search || getMonthLabel(r.month).includes(search) || r.month?.includes(search)
  );

  const statusLabel = (status) =>
    status === "approved" ? "معتمد" : status === "paid" ? "مدفوع" : "مسودة";
  const statusClass = (status) =>
    status === "approved" ? "bg-emerald-100 text-emerald-700" :
    status === "paid" ? "bg-blue-100 text-blue-700" :
    "bg-slate-100 text-slate-500";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="السجلات"
        title="أرشيف التقارير"
        description="كل تقارير الرواتب السابقة في مكان واحد."
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("reports")}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={15} />
          رجوع للتقرير الحالي
        </button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالشهر..."
          className="rounded-lg border border-line px-4 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-10 text-center text-slate-500">
          لا توجد تقارير
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onSelectReport(report)}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-5 py-4 text-right shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div>
                <p className="font-extrabold text-ink">{getMonthLabel(report.month)}</p>
                <p className="mt-1 text-xs text-slate-400">{report.fileName || "تقرير"}</p>
              </div>
              <span className={`rounded px-3 py-1 text-xs font-bold ${statusClass(report.status)}`}>
                {statusLabel(report.status)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SiteAdminPage({
  siteContent,
  setSiteContent,
  session,
  error,
  loading,
  onLogin,
  onLogout,
  onSave,
  onLanding,
  notice,
  setNotice
}) {
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <BrandBlock siteContent={siteContent} />
          <button
            type="button"
            onClick={onLanding}
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            الصفحة الرئيسية
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {session ? (
          <div className="space-y-5">
            {notice ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {notice}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-extrabold text-primary">أدمن الموقع</p>
                <h1 className="mt-1 text-2xl font-extrabold text-ink">إدارة واجهة ShiftPay HR</h1>
                <p className="mt-1 text-sm font-bold text-slate-500">{session.user?.email}</p>
              </div>
              <SecondaryButton type="button" onClick={onLogout} icon={LogOut}>
                تسجيل خروج الأدمن
              </SecondaryButton>
            </div>
            <SiteContentPanel
              siteContent={siteContent}
              setSiteContent={setSiteContent}
              onSave={onSave}
              loading={loading}
              setNotice={setNotice}
            />
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        ) : (
          <section className="mx-auto max-w-xl rounded-lg border border-line bg-white p-6 shadow-sm">
            <p className="text-sm font-extrabold text-primary">لوحة خاصة</p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink">تسجيل دخول أدمن الموقع</h1>
            <p className="mt-2 leading-7 text-slate-500">
              هذه الصفحة ليست للعملاء. الدخول مسموح فقط للإيميل المحدد في إعدادات المنصة.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <InputField
                label="اسم المستخدم أو الإيميل"
                type="text"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
              <InputField
                label="كلمة المرور"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              <PrimaryButton type="submit" icon={Users} disabled={loading || !SITE_ADMIN_PASSWORD} full>
                {loading ? "جاري الدخول" : "دخول لوحة الموقع"}
              </PrimaryButton>
            </form>
            {!SITE_ADMIN_PASSWORD ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                أضف VITE_SITE_ADMIN_PASSWORD و VITE_SITE_ADMIN_USERNAME في إعدادات الـ Vercel.
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}

function AuthPage({ mode, setMode, siteContent, cloud, onLogin, onGoogleLogin, onLanding }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "شركة جديدة",
    phoneCountry: "EG",
    phone: ""
  });
  const isSignup = mode === "signup";

  const submit = (event) => {
    event.preventDefault();
    onLogin({ mode, ...form });
  };

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <BrandBlock siteContent={siteContent} />
          <button
            type="button"
            onClick={onLanding}
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            الرجوع للصفحة الرئيسية
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <section className="hidden rounded-lg border border-line bg-ink p-8 text-white shadow-sm lg:block">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
            <BadgeCheck size={16} />
            حساب واحد لإدارة الشركة والرواتب
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight">
            ادخل بأمان، وبعدها ابدأ إدارة الموظفين وملفات البصمة.
          </h1>
          <div className="mt-8 grid gap-3">
            {[
              "احسب رواتب موظفيك في ثوانٍ من ملف البصمة",
              "ادعم شيفتات متعددة، إجازات، وأوفر تايم تلقائياً",
              "تقارير احترافية جاهزة للتصدير في أي وقت"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-white/10 p-3 text-sm font-bold">
                <CheckCircle2 size={18} className="text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-extrabold text-primary">ShiftPay HR</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              {isSignup ? "إنشاء حساب شركة" : "تسجيل دخول"}
            </h2>
            <p className="mt-2 leading-7 text-slate-500">
              {isSignup
                ? "سجل بيانات شركتك مرة واحدة، وبعدها هتدخل للنظام لإضافة الموظفين ورفع ملف البصمة."
                : "ادخل بحسابك الحالي لإدارة الشركة ومراجعة تقارير الرواتب."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={!cloud.configured || cloud.loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-3 font-extrabold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <GoogleLogo />
              المتابعة بحساب Google
            </button>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                  isSignup ? "bg-white text-primary shadow-sm" : "text-slate-500"
                }`}
              >
                إنشاء حساب
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                  !isSignup ? "bg-white text-primary shadow-sm" : "text-slate-500"
                }`}
              >
                تسجيل دخول
              </button>
            </div>

            {isSignup ? (
              <>
                <InputField
                  label="اسم الشركة"
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <SelectField
                    label="مفتاح الدولة"
                    value={form.phoneCountry}
                    onChange={(event) => setForm({ ...form, phoneCountry: event.target.value })}
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} {country.dialCode}
                      </option>
                    ))}
                  </SelectField>
                  <InputField
                    label="رقم الهاتف"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="100 000 0000"
                    required
                  />
                </div>
              </>
            ) : null}

            <InputField
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <InputField
              label="كلمة المرور"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <PrimaryButton type="submit" icon={Users} disabled={cloud.loading || !cloud.configured} full>
              {cloud.loading ? "جاري التنفيذ" : isSignup ? "إنشاء الحساب" : "دخول"}
            </PrimaryButton>
          </form>

          {!cloud.configured ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
              تسجيل الدخول السحابي غير مفعل في هذه النسخة.
            </div>
          ) : null}
          {cloud.error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-700">
              {cloud.error}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function BrandBlock({ siteContent, light = false }) {
  return (
    <div className="flex items-center gap-3">
      {siteContent.logo ? (
        <img src={siteContent.logo} alt="ShiftPay HR" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
      ) : (
        <LogoMark light={light} />
      )}
      <div>
        <p className={`text-lg font-extrabold ${light ? "text-white" : "text-ink"}`}>ShiftPay HR</p>
        <p className={`text-xs font-bold ${light ? "text-blue-100" : "text-slate-500"}`}>رواتب الحضور الذكية</p>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.2 0 5.8 1.1 7.9 3.1l5.9-5.9C34.2 3.4 29.5 1.4 24 1.4 14.7 1.4 6.8 6.7 3 14.4l6.9 5.4C11.5 13.8 17.1 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 2.1-1.7 5.2-4.9 7.3l6.7 5.2c3.9-3.6 7.6-9 7.6-16.2Z" />
      <path fill="#FBBC05" d="M9.9 28.2c-.4-1.2-.7-2.6-.7-4s.2-2.7.7-4L3 14.8C1.6 17.6.8 20.7.8 24.2c0 3.4.8 6.6 2.2 9.3l6.9-5.3Z" />
      <path fill="#34A853" d="M24 47c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 2.1-6.8 2.1-6.9 0-12.5-4.3-14.1-10.2L3 34.1C6.8 41.8 14.7 47 24 47Z" />
    </svg>
  );
}

function LandingPage({ cloud, onLogin, onGoogleLogin, onEnter }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ email: "", password: "", companyName: "شركة جديدة" });
  const isAuthenticated = Boolean(cloud.session);

  const submit = (event) => {
    event.preventDefault();
    onLogin({ mode, ...form });
  };

  const features = [
    {
      icon: UploadCloud,
      title: "رفع ملف البصمة",
      text: "استيراد Excel أو CSV، ثم تجميع أول حضور وآخر انصراف لكل موظف يوميا."
    },
    {
      icon: CircleDollarSign,
      title: "حساب الرواتب",
      text: "خصومات التأخير والغياب والإجازات والمكافآت تتحول إلى صافي راتب واضح."
    },
    {
      icon: FileText,
      title: "تقارير جاهزة",
      text: "تصدير Excel منسق وPDF أفقي قابل للطباعة مع قسائم راتب فردية."
    }
  ];

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-white/10 bg-ink px-4 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark light />
            <span className="text-xl font-extrabold">ShiftPay HR</span>
          </div>
          <button
            type="button"
            onClick={isAuthenticated ? onEnter : () => setMode("signin")}
            className="rounded-lg bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:bg-blue-50"
          >
            {isAuthenticated ? "فتح النظام" : "تسجيل دخول"}
          </button>
        </div>
      </header>

      <section className="relative min-h-[64vh] overflow-hidden bg-ink text-white">
        <HeroScene />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_430px] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100 backdrop-blur">
              <Sparkles size={16} />
              عربي أولا، جاهز للشركات الصغيرة والمتوسطة
            </div>
            <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
              ShiftPay HR
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-9 text-slate-200">
              منصة SaaS تحسب رواتب الموظفين تلقائيا من ملفات ماكينة البصمة، مع إدارة الأقسام
              والشيفتات والموظفين وتقارير احترافية قابلة للتصدير.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={isAuthenticated ? onEnter : () => setMode("signup")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-700"
              >
                {isAuthenticated ? "فتح النظام" : "إنشاء حساب الآن"}
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={isAuthenticated ? onEnter : () => setMode("signin")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-extrabold text-white backdrop-blur transition hover:bg-white/15"
              >
                تسجيل دخول
                <Users size={18} />
              </button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["7", "دول مدعومة"],
                ["2026", "إجازات محدثة"],
                ["PDF", "تقارير جاهزة"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-extrabold">{value}</p>
                  <p className="mt-1 text-xs font-bold text-blue-100">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white p-5 text-ink shadow-2xl">
            <div className="mb-5">
              <p className="text-sm font-extrabold text-primary">ابدأ الآن</p>
              <h2 className="mt-2 text-2xl font-extrabold">
                {isAuthenticated ? "حسابك جاهز" : mode === "signup" ? "إنشاء حساب شركة" : "تسجيل دخول"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {isAuthenticated
                  ? "يمكنك الدخول للنظام وإدارة بيانات الشركة من الحساب الحالي."
                  : "سجّل حسابك أولا، وبعدها هتدخل مباشرة للنظام لإضافة الموظفين ورفع ملف البصمة."}
              </p>
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  تم تسجيل الدخول باستخدام {cloud.user?.email || "حسابك الحالي"}.
                </div>
                <PrimaryButton type="button" onClick={onEnter} icon={ArrowLeft} full>
                  فتح النظام
                </PrimaryButton>
              </div>
            ) : !cloud.configured ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                تسجيل الدخول السحابي غير مفعل حاليا. يمكن تفعيله من إعدادات الاستضافة قبل استقبال العملاء.
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <SecondaryButton type="button" onClick={onGoogleLogin} icon={Mail} disabled={cloud.loading} full>
                  المتابعة بحساب Google
                </SecondaryButton>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                      mode === "signup" ? "bg-white text-primary shadow-sm" : "text-slate-500"
                    }`}
                  >
                    إنشاء حساب
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                      mode === "signin" ? "bg-white text-primary shadow-sm" : "text-slate-500"
                    }`}
                  >
                    تسجيل دخول
                  </button>
                </div>
                {mode === "signup" ? (
                  <InputField
                    label="اسم الشركة"
                    value={form.companyName}
                    onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                    required
                  />
                ) : null}
                <InputField
                  label="البريد الإلكتروني"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
                <InputField
                  label="كلمة المرور"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
                <PrimaryButton type="submit" icon={Users} disabled={cloud.loading} full>
                  {cloud.loading ? "جاري الدخول" : mode === "signup" ? "إنشاء الحساب" : "دخول"}
                </PrimaryButton>
                {cloud.error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {cloud.error}
                  </div>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <feature.icon size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-ink">{feature.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-sm md:grid-cols-3">
          {[
            { title: "إجازات رسمية حسب الدولة", text: "مصر ودول الخليج مع استبعاد تلقائي من أيام العمل." },
            { title: "قواعد خصم مرنة", text: "شرائح متعددة للتأخير بدل خصم واحد ثابت." },
            { title: "جاهز للتشغيل", text: "حسابات شركات ومزامنة سحابية بعد تسجيل الدخول." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-slate-50 p-4">
              <p className="font-extrabold text-ink">{item.title}</p>
              <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-white px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-lg font-extrabold text-ink">ShiftPay HR</p>
                <p className="text-sm text-slate-500">حساب الرواتب من ملفات البصمة</p>
              </div>
            </div>
            <p className="mt-4 max-w-md leading-7 text-slate-600">
              نظام عربي للشركات الصغيرة والمتوسطة يربط الحضور بالإجازات والسياسات المحلية.
            </p>
          </div>
          <div>
            <p className="mb-3 font-extrabold text-ink">روابط سريعة</p>
            <div className="grid gap-2 text-sm font-bold text-slate-600">
              {["إنشاء حساب", "تسجيل دخول", "رفع الحضور", "تقرير الرواتب"].map((link) => (
                <button key={link} type="button" onClick={() => setMode(link === "تسجيل دخول" ? "signin" : "signup")} className="text-right hover:text-primary">
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-extrabold text-ink">التواصل والدعم</p>
            <div className="space-y-3 text-sm font-bold text-slate-600">
              <p className="flex items-center gap-2">
                <Phone size={17} className="text-primary" />
                +20 100 000 0000
              </p>
              <p className="flex items-center gap-2">
                <Mail size={17} className="text-primary" />
                support@shiftpayhr.com
              </p>
              <p className="flex items-center gap-2">
                <Headphones size={17} className="text-primary" />
                دعم فني طوال أيام العمل
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.38),transparent_28%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f172a_100%)]" />
      <div className="hero-dashboard absolute -left-10 top-10 hidden w-[760px] rotate-[-4deg] rounded-lg border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur md:block">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <span className="text-sm font-bold text-blue-100">تقرير رواتب مايو ٢٠٢٦</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {["الموظفون", "الأقسام", "التأخير", "الصافي"].map((label, index) => (
          <div key={label} className="hero-kpi rounded-lg bg-white/95 p-4 text-ink">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-extrabold">
                {["٤٢", "٨", "١٢٦ د", "٤٨٠K"][index]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardView({
  metrics,
  departments,
  shifts,
  shiftCopy,
  reports,
  payrollRows,
  monthLabel,
  reportMonth,
  settings,
  onNavigate
}) {
  const holidayAlerts = getMonthlyHolidayAlerts(settings, reportMonth);
  const insights = [
    {
      label: "أيام الغياب",
      value: metrics.absenceDays,
      max: Math.max(metrics.absenceDays, metrics.activeEmployees * 4, 1),
      tone: "bg-rose-500"
    },
    {
      label: "دقائق التأخير",
      value: metrics.lateMinutes,
      max: Math.max(metrics.lateMinutes, 180, 1),
      tone: "bg-amber-500"
    },
    {
      label: "إجمالي الخصومات",
      value: Math.round(metrics.totalDeductions),
      max: Math.max(metrics.totalDeductions, metrics.totalNetSalary * 0.12, 1),
      tone: "bg-blue-500"
    },
    {
      label: "دقائق إضافية",
      value: metrics.overtimeMinutes,
      max: Math.max(metrics.overtimeMinutes, 180, 1),
      tone: "bg-emerald-500"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={monthLabel}
        title={`مرحبا، ${settings.companyName}`}
        description="ملخص سريع لحالة الموظفين والرواتب بناء على أحدث ملف حضور محفوظ في النظام."
        action={
          <PrimaryButton onClick={() => onNavigate("attendance")} icon={UploadCloud}>
            رفع ملف جديد
          </PrimaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الموظفين" value={metrics.activeEmployees} icon={Users} />
        <StatCard label="الأقسام" value={departments.length} icon={Building2} tone="emerald" />
        <StatCard label={shiftCopy.plural} value={shifts.length} icon={Clock} tone="amber" />
        <StatCard label="تقارير الرواتب" value={reports.length} icon={FileSpreadsheet} tone="rose" />
      </div>

      {holidayAlerts.length ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-primary">تنبيه إجازات هذا الشهر</p>
              <h2 className="mt-2 text-xl font-extrabold text-blue-950">
                يوجد {formatNumber(holidayAlerts.length)} يوم إجازة رسمية في {monthLabel}
              </h2>
            </div>
            <SecondaryButton type="button" onClick={() => onNavigate("settings")} icon={CalendarDays}>
              تعديل الإجازات
            </SecondaryButton>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {holidayAlerts.slice(0, 6).map((holiday) => (
              <div key={`${holiday.date}-${holiday.name}`} className="rounded-lg bg-white px-4 py-3">
                <p className="font-extrabold text-ink">{holiday.name}</p>
                <p className="mt-1 text-sm font-bold text-primary">{holiday.date}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-ink">رؤى الحضور</h2>
              <p className="mt-1 text-sm text-slate-500">أرقام مهمة قبل اعتماد كشف الرواتب.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-primary">
              {formatCurrency(metrics.totalNetSalary, settings.currency)}
            </span>
          </div>
          <div className="space-y-5">
            {insights.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-ink">{formatNumber(item.value)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.tone}`}
                    style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">معالج التشغيل السريع</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: `أضف الأقسام و${shiftCopy.plural}`, done: departments.length > 0 && shifts.length > 0, target: "departments" },
              { label: "أكمل بيانات الموظفين", done: metrics.activeEmployees > 0, target: "employees" },
              { label: "ارفع ملف الحضور الشهري", done: payrollRows.some((row) => row.attendanceDays > 0), target: "attendance" },
              { label: "راجع التقرير واعتمد الرواتب", done: reports.some((report) => report.status === "approved"), target: "reports" }
            ].map((step) => (
              <div key={step.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      step.done ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-400"
                    }`}
                  >
                    <CheckCircle2 size={20} />
                  </span>
                  <span className="font-bold text-slate-700">{step.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(step.target)}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary"
                >
                  فتح
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-ink">أعلى الحالات التي تحتاج مراجعة</h2>
            <p className="mt-1 text-sm text-slate-500">مرتبة حسب الغياب والتأخير.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("reports")}
            className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
          >
            فتح التقرير
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[...payrollRows]
            .sort((a, b) => b.absenceDays + b.lateCount - (a.absenceDays + a.lateCount))
            .slice(0, 3)
            .map((row) => (
              <article key={row.employeeCode} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-ink">{row.employeeName}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.department}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MetricPill label="غياب" value={`${formatNumber(row.absenceDays)} يوم`} />
                  <MetricPill label="تأخير" value={`${formatNumber(row.lateMinutes)} د`} />
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}

function DepartmentsView({ departments, setDepartments, setNotice }) {
  const [customName, setCustomName] = useState("");
  const [selected, setSelected] = useState(DEPARTMENT_PRESETS[0]);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");

  const isCustom = selected === "__custom__";
  const finalName = isCustom ? customName.trim() : selected;

  const addDepartment = (event) => {
    event.preventDefault();
    if (!finalName) return;
    if (departments.some((d) => d.name.toLowerCase() === finalName.toLowerCase())) {
      setNotice("هذا القسم موجود بالفعل.");
      return;
    }
    setDepartments([...departments, { id: makeId("dep"), name: finalName }]);
    setSelected(DEPARTMENT_PRESETS[0]);
    setCustomName("");
    setNotice("تمت إضافة القسم.");
  };

  const startEdit = (dep) => {
    setEditingId(dep.id);
    setEditName(dep.name);
  };

  const saveEdit = (id) => {
    const name = editName.trim();
    if (!name) return;
    setDepartments(departments.map((d) => d.id === id ? { ...d, name } : d));
    setEditingId("");
    setNotice("تم تحديث القسم.");
  };

  const deleteDepartment = (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    setDepartments(departments.filter((d) => d.id !== id));
    setNotice("تم حذف القسم.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="إدارة الهيكل"
        title="الأقسام"
        description="أضف الأقسام من الاقتراحات أو أدخل اسماً مخصصاً."
      />
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={addDepartment} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">قسم جديد</h2>
          <div className="mt-5 space-y-4">
            <SelectField
              label="اختر القسم"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {DEPARTMENT_PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="__custom__">✏️ أدخل اسماً مخصصاً...</option>
            </SelectField>
            {isCustom && (
              <InputField
                label="اسم القسم المخصص"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="مثال: اللوجستيات، التسويق..."
                required
              />
            )}
            <PrimaryButton type="submit" icon={Plus} full>
              إضافة القسم
            </PrimaryButton>
          </div>
        </form>
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">الأقسام الحالية</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line p-4"
              >
                {editingId === department.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(department.id)}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId("")}
                      className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                        <Building2 size={20} />
                      </span>
                      <span className="font-extrabold text-ink">{department.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(department)}
                        className="rounded-lg border border-line p-2 text-slate-500 hover:border-primary hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDepartment(department.id)}
                        className="rounded-lg border border-line p-2 text-slate-500 hover:border-rose-300 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function ShiftsView({ shifts, setShifts, setNotice, shiftCopy }) {
  const [form, setForm] = useState(() => makeEmptyShift());
  const [editingId, setEditingId] = useState("");

  const saveShift = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      gracePeriod: Number(form.gracePeriod) || 0,
      lateDeductionPerMinute: Number(form.lateDeductionPerMinute) || 0,
      overtimeRatePerMinute: Number(form.overtimeRatePerMinute) || 0,
      lateRules: form.lateRules
        .map((rule) => ({
          id: rule.id || makeId("rule"),
          afterMinutes: Number(rule.afterMinutes) || 0,
          deductionFraction: Number(rule.deductionFraction) || 0
        }))
        .filter((rule) => rule.afterMinutes > 0)
        .sort((a, b) => a.afterMinutes - b.afterMinutes),
      overtimeRules: form.overtimeRules
        .map((rule) => ({
          id: rule.id || makeId("ot"),
          afterMinutes: Number(rule.afterMinutes) || 0,
          overtimeMultiplier: Number(rule.overtimeMultiplier) || 1
        }))
        .filter((rule) => rule.afterMinutes > 0)
        .sort((a, b) => a.afterMinutes - b.afterMinutes),
      incompletePunchRules: form.incompletePunchRules
        .map((rule) => ({
          id: rule.id || makeId("ip"),
          occurrence: Number(rule.occurrence) || 0,
          deductionFraction: Number(rule.deductionFraction) || 0
        }))
        .filter((rule) => rule.occurrence > 0)
        .sort((a, b) => a.occurrence - b.occurrence),
      segments: form.segments
        .map((segment) => ({
          id: segment.id || makeId("seg"),
          startTime: segment.startTime,
          endTime: segment.endTime
        }))
        .filter((segment) => segment.startTime && segment.endTime),
      shiftKind: form.shiftKind || "standard",
      monthlyShiftTarget: Number(form.monthlyShiftTarget) || 0
    };
    payload.startTime = payload.segments[0]?.startTime || form.startTime;
    payload.endTime = payload.segments.at(-1)?.endTime || form.endTime;

    if (editingId) {
      setShifts(shifts.map((shift) => (shift.id === editingId ? { ...shift, ...payload } : shift)));
      setNotice(`تم تحديث ${shiftCopy.definite}.`);
    } else {
      setShifts([...shifts, { id: makeId("shift"), ...payload }]);
      setNotice(`تم إنشاء ${shiftCopy.definite}.`);
    }

    setForm(makeEmptyShift());
    setEditingId("");
  };

  const deleteShift = (shiftId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الشيفت؟")) return;
    setShifts(shifts.filter((s) => s.id !== shiftId));
    setNotice("تم حذف الشيفت.");
    if (editingId === shiftId) {
      setEditingId("");
      setForm(makeEmptyShift());
    }
  };

  const editShift = (shift) => {
    setEditingId(shift.id);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriod: shift.gracePeriod,
      lateDeductionPerMinute: shift.lateDeductionPerMinute,
      overtimeRatePerMinute: shift.overtimeRatePerMinute || 0,
      lateRules: shift.lateRules?.length
        ? shift.lateRules
        : [{ id: makeId("rule"), afterMinutes: 15, deductionFraction: 0.25 }],
      overtimeRules: shift.overtimeRules?.length
        ? shift.overtimeRules
        : [{ id: makeId("ot"), afterMinutes: 30, overtimeMultiplier: 1.0 }],
      incompletePunchRules: shift.incompletePunchRules?.length
        ? shift.incompletePunchRules
        : [
            { id: makeId("ip"), occurrence: 1, deductionFraction: 0.25 },
            { id: makeId("ip"), occurrence: 2, deductionFraction: 0.5 },
            { id: makeId("ip"), occurrence: 3, deductionFraction: 1.0 }
          ],
      segments: shift.segments?.length
        ? shift.segments.map((segment, index) => ({ id: segment.id || `seg-${index}`, ...segment }))
        : [{ id: makeId("seg"), startTime: shift.startTime, endTime: shift.endTime }],
      shiftKind: shift.shiftKind || "standard",
      monthlyShiftTarget: shift.monthlyShiftTarget || ""
    });
  };

  const updateLateRule = (ruleId, patch) => {
    setForm({
      ...form,
      lateRules: form.lateRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule))
    });
  };

  const addLateRule = () => {
    setForm({
      ...form,
      lateRules: [...form.lateRules, { id: makeId("rule"), afterMinutes: 15, deductionAmount: 75 }]
    });
  };

  const removeLateRule = (ruleId) => {
    setForm({ ...form, lateRules: form.lateRules.filter((rule) => rule.id !== ruleId) });
  };

  const updateOvertimeRule = (ruleId, patch) => {
    setForm({
      ...form,
      overtimeRules: form.overtimeRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule))
    });
  };

  const addOvertimeRule = () => {
    setForm({
      ...form,
      overtimeRules: [...form.overtimeRules, { id: makeId("ot"), afterMinutes: 90, bonusAmount: 220 }]
    });
  };

  const removeOvertimeRule = (ruleId) => {
    setForm({ ...form, overtimeRules: form.overtimeRules.filter((rule) => rule.id !== ruleId) });
  };

  const updateIncompletePunchRule = (ruleId, patch) => {
    setForm({
      ...form,
      incompletePunchRules: form.incompletePunchRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule
      )
    });
  };

  const addIncompletePunchRule = () => {
    const nextOccurrence = form.incompletePunchRules.length + 1;
    setForm({
      ...form,
      incompletePunchRules: [
        ...form.incompletePunchRules,
        { id: makeId("ip"), occurrence: nextOccurrence, deductionFraction: 1.0 }
      ]
    });
  };

  const removeIncompletePunchRule = (ruleId) => {
    setForm({
      ...form,
      incompletePunchRules: form.incompletePunchRules.filter((rule) => rule.id !== ruleId)
    });
  };

  const updateSegment = (segmentId, patch) => {
    const nextSegments = form.segments.map((segment) =>
      segment.id === segmentId ? { ...segment, ...patch } : segment
    );
    setForm({
      ...form,
      segments: nextSegments,
      startTime: nextSegments[0]?.startTime || form.startTime,
      endTime: nextSegments.at(-1)?.endTime || form.endTime
    });
  };

  const addSegment = () => {
    setForm({
      ...form,
      segments: [...form.segments, { id: makeId("seg"), startTime: "17:00", endTime: "21:00" }]
    });
  };

  const removeSegment = (segmentId) => {
    const nextSegments = form.segments.filter((segment) => segment.id !== segmentId);
    if (!nextSegments.length) return;
    setForm({
      ...form,
      segments: nextSegments,
      startTime: nextSegments[0]?.startTime || form.startTime,
      endTime: nextSegments.at(-1)?.endTime || form.endTime
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="سياسات الحضور"
        title={`إدارة ${shiftCopy.plural}`}
        description={`عرّف ${shiftCopy.definite} كفترة واحدة أو شيفت مقسم، واضبط خصومات التأخير ومكافآت الوقت الإضافي لكل فترة.`}
      />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={saveShift} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">
            {editingId ? `تعديل ${shiftCopy.definite}` : `${shiftCopy.singular} جديد`}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InputField
              label={`اسم ${shiftCopy.definite}`}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <InputField
              label="فترة السماح بالدقائق"
              type="number"
              value={form.gracePeriod}
              onChange={(event) => setForm({ ...form, gracePeriod: event.target.value })}
              required
            />
            <InputField
              label="وقت البداية"
              type="time"
              value={form.startTime}
              onChange={(event) =>
                setForm({
                  ...form,
                  startTime: event.target.value,
                  segments: form.segments.map((segment, index) =>
                    index === 0 ? { ...segment, startTime: event.target.value } : segment
                  )
                })
              }
              required
            />
            <InputField
              label="وقت النهاية"
              type="time"
              value={form.endTime}
              onChange={(event) =>
                setForm({
                  ...form,
                  endTime: event.target.value,
                  segments: form.segments.map((segment, index) =>
                    index === form.segments.length - 1 ? { ...segment, endTime: event.target.value } : segment
                  )
                })
              }
              required
            />

          </div>
          <div className="mt-5 rounded-lg border border-line bg-amber-50 p-4">
            <h3 className="font-extrabold text-ink mb-3">خيارات متقدمة</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">نوع الشيفت</span>
                <select
                  value={form.shiftKind}
                  onChange={(event) => setForm({ ...form, shiftKind: event.target.value })}
                  className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                >
                  <option value="standard">عادي (بالأيام)</option>
                  <option value="shift_count">بعدد الشيفتات (24 ساعة / متغير)</option>
                </select>
              </label>
              {form.shiftKind === "shift_count" && (
                <InputField
                  label="عدد الشيفتات الشهرية المستهدفة"
                  type="number"
                  min="1"
                  value={form.monthlyShiftTarget}
                  onChange={(event) => setForm({ ...form, monthlyShiftTarget: event.target.value })}
                />
              )}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-ink">فترات {shiftCopy.definite}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  أضف فترة ثانية للشيفت المقسم. كل فترة يتم حساب حضورها وتأخيرها والوقت الإضافي لها منفصلين.
                </p>
              </div>
              <SecondaryButton type="button" onClick={addSegment} icon={Plus}>
                إضافة فترة
              </SecondaryButton>
            </div>
            <div className="mt-4 grid gap-3">
              {form.segments.map((segment, index) => (
                <div key={segment.id} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[auto_1fr_1fr_auto]">
                  <span className="self-end rounded-lg bg-blue-50 px-3 py-3 text-sm font-extrabold text-primary">
                    فترة {index + 1}
                  </span>
                  <InputField
                    label="بداية الفترة"
                    type="time"
                    value={segment.startTime}
                    onChange={(event) => updateSegment(segment.id, { startTime: event.target.value })}
                  />
                  <InputField
                    label="نهاية الفترة"
                    type="time"
                    value={segment.endTime}
                    onChange={(event) => updateSegment(segment.id, { endTime: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeSegment(segment.id)}
                    disabled={form.segments.length === 1}
                    className="self-end rounded-lg border border-line px-4 py-3 text-sm font-bold text-rose-600 hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-ink">شرائح خصم التأخير</h3>
                <p className="mt-1 text-sm text-slate-500">
                  اختر قيمة خصم ثابتة عند تجاوز عدد دقائق معين بعد فترة السماح.
                </p>
              </div>
              <SecondaryButton type="button" onClick={addLateRule} icon={Plus}>
                إضافة شريحة
              </SecondaryButton>
            </div>
            <div className="mt-4 grid gap-3">
              {form.lateRules.map((rule) => (
                <div key={rule.id} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <InputField
                    label="بعد دقائق تأخير"
                    type="number"
                    value={rule.afterMinutes}
                    onChange={(event) => updateLateRule(rule.id, { afterMinutes: event.target.value })}
                  />
                  <SelectField
                    label="الخصم"
                    value={rule.deductionFraction ?? 0.25}
                    onChange={(event) => updateLateRule(rule.id, { deductionFraction: Number(event.target.value) })}
                  >
                    <option value={0.25}>ربع يوم (25%)</option>
                    <option value={0.5}>نص يوم (50%)</option>
                    <option value={0.75}>ثلاثة أرباع يوم (75%)</option>
                    <option value={1.0}>يوم كامل (100%)</option>
                  </SelectField>
                  <button
                    type="button"
                    onClick={() => removeLateRule(rule.id)}
                    className="self-end rounded-lg border border-line px-4 py-3 text-sm font-bold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-emerald-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-ink">شرائح مكافأة الوقت الإضافي</h3>
                <p className="mt-1 text-sm text-slate-500">
                  احسب زيادة الموظف عند البقاء بعد نهاية الفترة بنفس فكرة شرائح الخصم.
                </p>
              </div>
              <SecondaryButton type="button" onClick={addOvertimeRule} icon={Plus}>
                إضافة شريحة
              </SecondaryButton>
            </div>
            <div className="mt-4 grid gap-3">
              {form.overtimeRules.map((rule) => (
                <div key={rule.id} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <InputField
                    label="بعد دقائق إضافية"
                    type="number"
                    value={rule.afterMinutes}
                    onChange={(event) => updateOvertimeRule(rule.id, { afterMinutes: event.target.value })}
                  />
                  <SelectField
                    label="مضاعف الساعة"
                    value={rule.overtimeMultiplier ?? 1}
                    onChange={(event) => updateOvertimeRule(rule.id, { overtimeMultiplier: Number(event.target.value) })}
                  >
                    <option value={1.0}>× 1 (نفس سعر الساعة)</option>
                    <option value={1.5}>× 1.5 (ساعة ونص)</option>
                    <option value={2.0}>× 2 (ساعتين)</option>
                  </SelectField>
                  <button
                    type="button"
                    onClick={() => removeOvertimeRule(rule.id)}
                    className="self-end rounded-lg border border-line px-4 py-3 text-sm font-bold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-amber-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-ink">شرائح خصم البصمة الناقصة الشهرية</h3>
                <p className="mt-1 text-sm text-slate-500">
                  يوم فيه دخول من غير خروج (أو العكس). الجدول تصاعدي حسب عدد المرات لكل موظف في الشهر.
                </p>
              </div>
              <SecondaryButton type="button" onClick={addIncompletePunchRule} icon={Plus}>
                إضافة شريحة
              </SecondaryButton>
            </div>
            <div className="mt-4 grid gap-3">
              {form.incompletePunchRules.map((rule) => (
                <div key={rule.id} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <SelectField
                    label="المرة رقم"
                    value={rule.occurrence ?? 1}
                    onChange={(event) => updateIncompletePunchRule(rule.id, { occurrence: Number(event.target.value) })}
                  >
                    <option value={1}>الأولى</option>
                    <option value={2}>الثانية</option>
                    <option value={3}>الثالثة</option>
                    <option value={4}>الرابعة فأكثر</option>
                  </SelectField>
                  <SelectField
                    label="الخصم"
                    value={rule.deductionFraction ?? 0.25}
                    onChange={(event) =>
                      updateIncompletePunchRule(rule.id, { deductionFraction: Number(event.target.value) })
                    }
                  >
                    <option value={0.25}>ربع يوم (25%)</option>
                    <option value={0.5}>نص يوم (50%)</option>
                    <option value={0.75}>ثلاثة أرباع يوم (75%)</option>
                    <option value={1.0}>يوم كامل (100%)</option>
                  </SelectField>
                  <button
                    type="button"
                    onClick={() => removeIncompletePunchRule(rule.id)}
                    className="self-end rounded-lg border border-line px-4 py-3 text-sm font-bold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton type="submit" icon={Save}>
              حفظ {shiftCopy.definite}
            </PrimaryButton>
            {editingId ? (
              <SecondaryButton
                type="button"
                onClick={() => {
                  setEditingId("");
                  setForm(makeEmptyShift());
                }}
              >
                إلغاء
              </SecondaryButton>
            ) : null}
          </div>
        </form>
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">{shiftCopy.plural} الحالية</h2>
          <div className="mt-5 grid gap-3">
            {shifts.map((shift) => (
              <article key={shift.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold text-ink">{shift.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editShift(shift)}
                      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
                    >
                      <Pencil size={16} />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteShift(shift.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricPill label="فترة السماح" value={`${shift.gracePeriod} دقيقة`} />
                  <MetricPill
                    label={`فترات ${shiftCopy.definite}`}
                    value={
                      shift.segments?.length
                        ? shift.segments.map((segment) => `${segment.startTime}-${segment.endTime}`).join("، ")
                        : `${shift.startTime}-${shift.endTime}`
                    }
                  />
                  <MetricPill
                    label="شرائح التأخير"
                    value={
                      shift.lateRules?.length
                        ? shift.lateRules
                            .map((rule) => `${rule.afterMinutes}د = ${formatCurrency(rule.deductionAmount)}`)
                            .join("، ")
                        : `${shift.lateDeductionPerMinute} / دقيقة`
                    }
                  />
                  <MetricPill
                    label="الوقت الإضافي"
                    value={
                      shift.overtimeRules?.length
                        ? shift.overtimeRules
                            .map((rule) => `${rule.afterMinutes}د = ${formatCurrency(rule.bonusAmount)}`)
                            .join("، ")
                        : `${shift.overtimeRatePerMinute || 0} / دقيقة`
                    }
                  />
                  <MetricPill
                    label="خصم البصمة الناقصة"
                    value={
                      shift.incompletePunchRules?.length
                        ? shift.incompletePunchRules
                            .map((rule) => `مرة ${rule.occurrence} = ${Math.round((rule.deductionFraction || 0) * 100)}%`)
                            .join("، ")
                        : "غير مُفعّل"
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function EmployeesView({ employees, setEmployees, departments, shifts, shiftCopy, setNotice }) {
  const emptyEmployee = {
    code: "",
    name: "",
    departmentId: departments[0]?.id || "",
    shiftId: shifts[0]?.id || "",
    salary: "",
    vacationBalance: 0,
    extraDeductions: 0,
    bonuses: 0,
    notes: "",
    shiftAssignmentMode: "fixed",
    flexibleWeeklyRestDays: 0,
    hireDate: "",
    jobTitle: "",
    salaryHistory: []
  };
  const [form, setForm] = useState(emptyEmployee);
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineForm, setInlineForm] = useState({
    departmentId: departments[0]?.id || "",
    shiftId: shifts[0]?.id || "",
    salary: "",
    vacationBalance: 0,
    extraDeductions: 0,
    bonuses: 0,
    notes: "",
    shiftAssignmentMode: "fixed",
    flexibleWeeklyRestDays: 0,
    hireDate: "",
    jobTitle: "",
    salaryHistory: []
  });
  const [filter, setFilter] = useState("active");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const visibleEmployees = employees
    .filter((employee) => (filter === "active" ? employee.active : !employee.active))
    .filter((employee) => {
      const query = employeeSearch.trim().toLowerCase();
      if (!query) return true;
      return `${employee.code} ${employee.name}`.toLowerCase().includes(query);
    });

  const saveEmployee = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      salary: Number(form.salary) || 0,
      vacationBalance: Number(form.vacationBalance) || 0,
      extraDeductions: Number(form.extraDeductions) || 0,
      bonuses: Number(form.bonuses) || 0,
      shiftAssignmentMode: form.shiftAssignmentMode || "fixed",
      flexibleWeeklyRestDays: Number(form.flexibleWeeklyRestDays) || 0,
      hireDate: form.hireDate || "",
      jobTitle: form.jobTitle || "",
      salaryHistory: form.salaryHistory || []
    };

    setEmployees([...employees, { id: makeId("emp"), ...payload, active: true }]);
    setNotice("تمت إضافة الموظف.");
    setForm(emptyEmployee);
  };

  const editEmployee = (employee) => {
    setInlineEditingId(employee.id);
    setInlineForm({
      departmentId: employee.departmentId,
      shiftId: employee.shiftId,
      salary: employee.salary,
      vacationBalance: employee.vacationBalance,
      extraDeductions: employee.extraDeductions,
      bonuses: employee.bonuses,
      notes: employee.notes || "",
      hireDate: employee.hireDate || "",
      jobTitle: employee.jobTitle || "",
      salaryHistory: employee.salaryHistory || []
    });
  };

  const saveInlineEmployee = (employeeId) => {
    const currentEmployee = employees.find((e) => e.id === employeeId);
    const newSalary = Number(inlineForm.salary) || 0;
    const oldSalary = Number(currentEmployee?.salary) || 0;
    const salaryHistory = currentEmployee?.salaryHistory || [];
    const updatedSalaryHistory = newSalary !== oldSalary && oldSalary > 0
      ? [...salaryHistory, { date: new Date().toISOString().slice(0, 10), from: oldSalary, to: newSalary }]
      : salaryHistory;

    const payload = {
      departmentId: inlineForm.departmentId,
      shiftId: inlineForm.shiftId,
      salary: newSalary,
      vacationBalance: Number(inlineForm.vacationBalance) || 0,
      extraDeductions: Number(inlineForm.extraDeductions) || 0,
      bonuses: Number(inlineForm.bonuses) || 0,
      notes: inlineForm.notes || "",
      hireDate: inlineForm.hireDate || currentEmployee?.hireDate || "",
      jobTitle: inlineForm.jobTitle || currentEmployee?.jobTitle || "",
      salaryHistory: updatedSalaryHistory
    };
    setEmployees(employees.map((employee) => (employee.id === employeeId ? { ...employee, ...payload } : employee)));
    setInlineEditingId("");
    setNotice("تم تحديث بيانات الموظف.");
  };

  const setArchived = (employeeId, active) => {
    if (!active && !window.confirm("هل أنت متأكد من أرشفة هذا الموظف؟")) return;
    setEmployees(employees.map((employee) => (employee.id === employeeId ? { ...employee, active } : employee)));
    setNotice(active ? "تمت استعادة الموظف." : "تمت أرشفة الموظف.");
  };

  const getBulkValue = (row, aliases) => {
    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[إأآا]/g, "ا")
        .replace(/[ىي]/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[\s_\-./()]+/g, "");
    const wanted = aliases.map(normalize);
    const key = Object.keys(row).find((item) => wanted.includes(normalize(item)));
    return key ? row[key] : "";
  };

  const handleBulkEmployees = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const existingCodes = new Set(employees.map((employee) => String(employee.code).trim().toLowerCase()));
    const departmentByName = new Map(
      departments.map((department) => [department.name.trim().toLowerCase(), department.id])
    );
    const shiftByName = new Map(shifts.map((shift) => [shift.name.trim().toLowerCase(), shift.id]));
    const imported = [];
    let skipped = 0;

    rows.forEach((row) => {
      const code = String(
        getBulkValue(row, ["EmployeeCode", "Employee Code", "Code", "كود", "الكود", "كود الموظف"])
      ).trim();
      const name = String(
        getBulkValue(row, ["Name", "EmployeeName", "Employee Name", "الاسم", "اسم الموظف"])
      ).trim();

      if (!code || !name || existingCodes.has(code.toLowerCase())) {
        skipped += 1;
        return;
      }

      const departmentName = String(getBulkValue(row, ["Department", "القسم", "قسم"])).trim().toLowerCase();
      const shiftName = String(getBulkValue(row, ["Shift", "الشيفت", "النوبة", "الدوام"])).trim().toLowerCase();
      imported.push({
        id: makeId("emp"),
        code,
        name,
        departmentId: departmentByName.get(departmentName) || "",
        shiftId: shiftByName.get(shiftName) || "",
        salary: Number(getBulkValue(row, ["Salary", "الراتب", "المرتب"])) || 0,
        vacationBalance: Number(getBulkValue(row, ["VacationBalance", "Vacation Balance", "الإجازات", "رصيد الإجازات"])) || 0,
        extraDeductions: 0,
        bonuses: 0,
        notes: "",
        active: true
      });
      existingCodes.add(code.toLowerCase());
    });

    if (imported.length) setEmployees([...employees, ...imported]);
    setImportSummary({ added: imported.length, skipped });
    setNotice(`تم إضافة ${imported.length} موظف، تم تجاهل ${skipped} صف`);
    event.target.value = "";
  };

  const downloadEmployeeTemplate = async () => {
    await exportEmployeeTemplate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="بيانات مرة واحدة"
        title="إدارة الموظفين"
        description="احتفظ بكود الموظف مطابقا لكود ماكينة البصمة لضمان حساب الرواتب تلقائيا عند رفع ملف الحضور."
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-ink">استيراد من Excel</h2>
            <p className="mt-2 leading-7 text-slate-500">
              ارفع شيت فيه الأكواد والأسماء مرة واحدة. القسم والشيفت والراتب والإجازات اختيارية ويمكن تعديلها لاحقا.
            </p>
          </div>
          <SecondaryButton type="button" onClick={downloadEmployeeTemplate} icon={Download}>
            تحميل نموذج الموظفين
          </SecondaryButton>
        </div>
        <label className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
          <FileSpreadsheet size={18} />
          رفع ملف الموظفين
          <input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkEmployees} />
        </label>
        {importSummary ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            تم إضافة {formatNumber(importSummary.added)} موظف، تم تجاهل {formatNumber(importSummary.skipped)} صف.
          </div>
        ) : null}
      </section>

      <form onSubmit={saveEmployee} className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-ink">إضافة موظف</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField
            label="كود الموظف"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            required
          />
          <InputField
            label="اسم الموظف"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <SelectField
            label="القسم"
            value={form.departmentId}
            onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={shiftCopy.definite}
            value={form.shiftId}
            onChange={(event) => setForm({ ...form, shiftId: event.target.value })}
          >
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="الراتب الأساسي"
            type="number"
            value={form.salary}
            onChange={(event) => setForm({ ...form, salary: event.target.value })}
            required
          />
          <InputField
            label="رصيد الإجازات"
            type="number"
            value={form.vacationBalance}
            onChange={(event) => setForm({ ...form, vacationBalance: event.target.value })}
          />
          <InputField
            label="خصومات إضافية"
            type="number"
            value={form.extraDeductions}
            onChange={(event) => setForm({ ...form, extraDeductions: event.target.value })}
          />
          <InputField
            label="مكافآت"
            type="number"
            value={form.bonuses}
            onChange={(event) => setForm({ ...form, bonuses: event.target.value })}
          />
          <InputField
            label="المسمى الوظيفي"
            value={form.jobTitle}
            onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
            placeholder="مثال: مدير مبيعات، محاسب، مشرف إنتاج"
          />
          <InputField
            label="تاريخ التعيين"
            type="date"
            value={form.hireDate}
            onChange={(event) => setForm({ ...form, hireDate: event.target.value })}
          />
          <label className="md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-sm font-bold text-slate-700">ملاحظات</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="min-h-24 w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <div className="md:col-span-2 xl:col-span-4 rounded-lg border border-line bg-slate-50 p-4">
            <h3 className="font-extrabold text-ink mb-3">خيارات متقدمة</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">وضع تحديد الشيفت</span>
                <select
                  value={form.shiftAssignmentMode}
                  onChange={(event) => setForm({ ...form, shiftAssignmentMode: event.target.value })}
                  className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                >
                  <option value="fixed">ثابت (الشيفت المحدد)</option>
                  <option value="auto">تلقائي (اكتشاف من وقت البصمة)</option>
                </select>
              </label>
              <InputField
                label="أيام الراحة المرنة في الأسبوع"
                type="number"
                min="0"
                max="7"
                value={form.flexibleWeeklyRestDays}
                onChange={(event) => setForm({ ...form, flexibleWeeklyRestDays: event.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-5">
          <PrimaryButton type="submit" icon={Save}>
            حفظ الموظف
          </PrimaryButton>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-ink">قائمة الموظفين</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <SearchField
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="بحث بالكود أو الاسم"
            />
            <div className="flex rounded-lg border border-line bg-slate-50 p-1">
              {[
                ["active", "نشط"],
                ["archived", "مؤرشف"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-md px-4 py-2 text-sm font-bold ${
                    filter === id ? "bg-white text-primary shadow-sm" : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {visibleEmployees.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                departments={departments}
                shifts={shifts}
                shiftCopy={shiftCopy}
                isEditing={inlineEditingId === employee.id}
                editForm={inlineForm}
                onEditFormChange={setInlineForm}
                onEdit={() => editEmployee(employee)}
                onSaveEdit={() => saveInlineEmployee(employee.id)}
                onCancelEdit={() => setInlineEditingId("")}
                onArchive={() => setArchived(employee.id, false)}
                onRestore={() => setArchived(employee.id, true)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="لا توجد نتائج"
            text="غير كلمة البحث أو بدّل بين الموظفين النشطين والمؤرشفين."
          />
        )}
      </section>
    </div>
  );
}

function AttendanceView({
  uploadState,
  setUploadState,
  employees,
  setEmployees,
  departments,
  shifts,
  settings,
  reports,
  setAttendanceLogs,
  setReports,
  setSelectedReportId,
  setReportMonth,
  setNotice,
  onReport
}) {
  const [punchMode, setPunchMode] = useState("auto");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState({ loading: true, summary: null });
    const result = await parseAttendanceFile(file);
    const month = result.logs.length > 0 ? getReportMonth(result.logs) : "";
    const incompleteDays = detectIncompleteAttendanceDays(result.logs);

    setPunchMode("auto");
    setUploadState({ loading: false, summary: { ...result, fileName: file.name, month, incompleteDays } });
    event.target.value = "";
  };

  const approveUpload = () => {
    const summary = uploadState.summary;
    if (!summary?.logs?.length) return;

    const reportId = makeId("report");
    const rowsCount = summary.groupedRows || summary.validRows;
    const isNewReport = !reports.some(
      (report) => report.month === summary.month && report.fileName === summary.fileName && report.rows === rowsCount
    );
    const appliedPunchMode = summary.incompleteDays?.length ? punchMode : "auto";
    setAttendanceLogs(summary.logs);
    setReports((previous) => [
      {
        id: reportId,
        month: summary.month,
        fileName: summary.fileName,
        rows: rowsCount,
        logs: summary.logs,
        status: "draft",
        incompletePunchMode: appliedPunchMode,
        createdAt: new Date().toISOString()
      },
      ...previous
    ]);
    setSelectedReportId(reportId);
    setReportMonth(summary.month);
    if (isNewReport) {
      const nextPayrollRows = calculatePayroll({
        employees,
        departments,
        shifts,
        attendanceLogs: summary.logs,
        settings,
        reportMonth: summary.month,
        incompletePunchMode: appliedPunchMode
      });
      const updatedEmployees = employees.map((employee) => {
        const row = nextPayrollRows.find((item) => item.employeeId === employee.id);
        if (!row || row.vacationUsage <= 0) return employee;
        return {
          ...employee,
          vacationBalance: Math.max(0, (Number(employee.vacationBalance) || 0) - row.vacationUsage)
        };
      });
      setEmployees(updatedEmployees);
      setNotice("تم حفظ التقرير وخصم أيام الإجازة من أرصدة الموظفين تلقائيًا.");
    } else {
      setNotice("تم اعتماد ملف الحضور وحفظه كتقرير مستقل.");
    }
    onReport();
  };

  const downloadTemplate = async () => {
    await exportAttendanceTemplate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance Upload"
        title="رفع ملف الحضور"
        description="اقبل ملف Excel أو CSV بالأعمدة المطلوبة، ثم يحسب النظام الرواتب تلقائيا من أول حضور وآخر انصراف."
        action={
          <SecondaryButton type="button" onClick={downloadTemplate} icon={Download}>
            تحميل نموذج الحضور
          </SecondaryButton>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-dashed border-blue-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <UploadCloud size={30} />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-ink">اسحب ملف البصمة أو اختره</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            يدعم النظام أعمدة عربية أو إنجليزية مثل EmployeeCode, Name, Date, CheckIn, CheckOut
            ثم يجمع البصمات المتكررة حسب الموظف والتاريخ تلقائيا.
          </p>
          <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-sm font-bold text-slate-600 sm:grid-cols-3">
            <span className="rounded-lg bg-slate-50 px-3 py-2">حضور/انصراف مباشر</span>
            <span className="rounded-lg bg-slate-50 px-3 py-2">سجل بصمة لكل حركة</span>
            <span className="rounded-lg bg-slate-50 px-3 py-2">أعمدة دخول وخروج متعددة</span>
          </div>
          <label className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
            <FileSpreadsheet size={18} />
            اختيار ملف
            <input
              className="hidden"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUpload}
              disabled={uploadState.loading}
            />
          </label>
          {uploadState.loading ? (
            <p className="mt-4 text-sm font-bold text-primary">جاري تحليل الملف...</p>
          ) : null}
        </div>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">معالج قراءة فورمات البصمة</h2>
          {uploadState.summary ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricPill label="إجمالي الصفوف" value={uploadState.summary.totalRows} />
                <MetricPill label="صفوف صحيحة" value={uploadState.summary.validRows} />
                <MetricPill
                  label="بعد التجميع"
                  value={uploadState.summary.groupedRows || uploadState.summary.logs.length}
                />
                <MetricPill label="نوع الفورمات" value={uploadState.summary.formatType || "قياسي"} />
              </div>
              {uploadState.summary.mappedColumns?.length ? (
                <div className="rounded-lg border border-line bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-extrabold text-ink">الأعمدة التي تم التعرف عليها</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {uploadState.summary.mappedColumns.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-bold text-slate-500">{item.label}</span>
                        <span className="max-w-[160px] truncate font-extrabold text-ink">
                          {item.column || "غير موجود"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {uploadState.summary.errors.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 font-extrabold text-amber-900">ملاحظات تحتاج مراجعة</p>
                  <ul className="space-y-2 text-sm leading-6 text-amber-800">
                    {uploadState.summary.errors.slice(0, 6).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
                  كل الصفوف المقروءة سليمة.
                </div>
              )}
              {uploadState.summary.incompleteDays?.length ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="mb-2 font-extrabold text-amber-900">
                    فيه {uploadState.summary.incompleteDays.length} يوم ببصمة ناقصة (دخول من غير خروج، أو العكس)
                  </p>
                  <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm leading-6 text-amber-800">
                    {uploadState.summary.incompleteDays.slice(0, 8).map((entry) => (
                      <li key={`${entry.employeeCode}-${entry.date}`}>
                        {entry.name || entry.employeeCode} · {entry.date} ·{" "}
                        {entry.missing === "checkOut" ? "بدون بصمة انصراف" : "بدون بصمة حضور"}
                      </li>
                    ))}
                    {uploadState.summary.incompleteDays.length > 8 ? (
                      <li>و {uploadState.summary.incompleteDays.length - 8} حالة أخرى...</li>
                    ) : null}
                  </ul>
                  <p className="mb-2 text-sm font-bold text-amber-900">اختر طريقة التعامل مع هذه الأيام:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPunchMode("auto")}
                      className={`rounded-lg border p-3 text-right text-sm transition ${
                        punchMode === "auto"
                          ? "border-primary bg-white ring-2 ring-primary/30"
                          : "border-amber-200 bg-white/60 hover:border-primary"
                      }`}
                    >
                      <span className="block font-extrabold text-ink">تطبيق سياسة الخصم التلقائي</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        يطبق الجدول التصاعدي المحدد لكل شيفت حسب عدد المرات لكل موظف في الشهر.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPunchMode("manual")}
                      className={`rounded-lg border p-3 text-right text-sm transition ${
                        punchMode === "manual"
                          ? "border-primary bg-white ring-2 ring-primary/30"
                          : "border-amber-200 bg-white/60 hover:border-primary"
                      }`}
                    >
                      <span className="block font-extrabold text-ink">مراجعة يدوية</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        بدون خصم تلقائي؛ الأيام دي هتتحسب "تحتاج مراجعة" وتسيبها لـ HR يدخلها بنفسه.
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
              {uploadState.summary.logs.length ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-line">
                    <div className="border-b border-line bg-slate-50 px-4 py-3 text-sm font-extrabold text-ink">
                      معاينة أول 5 صفوف
                    </div>
                    <div className="dashboard-scroll overflow-x-auto">
                      <table className="w-full min-w-[560px] text-right text-sm">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            {["الكود", "الاسم", "التاريخ", "حضور", "انصراف", "البصمات"].map((header) => (
                              <th key={header} className="border-b border-line px-3 py-3 font-bold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {uploadState.summary.previewRows.map((row, index) => (
                            <tr key={`${row.employeeCode}-${row.date}-${index}`}>
                              <td className="px-3 py-3 font-bold">{row.employeeCode}</td>
                              <td className="px-3 py-3">{row.name}</td>
                              <td className="px-3 py-3">{row.date}</td>
                              <td className="px-3 py-3">{row.checkIn}</td>
                              <td className="px-3 py-3">{row.checkOut}</td>
                              <td className="px-3 py-3 text-xs text-slate-500">
                                {row.punches?.length ? row.punches.join("، ") : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PrimaryButton onClick={approveUpload} icon={FileText} full>
                    اعتماد الملف وفتح التقرير
                  </PrimaryButton>
                </div>
              ) : null}
              {uploadState.summary.logs.length ? (
                <SecondaryButton onClick={() => setUploadState({ loading: false, summary: null })} full>
                  إلغاء المعاينة
                </SecondaryButton>
              ) : null}
              {!uploadState.summary.logs.length && uploadState.summary.errors.length ? (
                <SecondaryButton onClick={() => setUploadState({ loading: false, summary: null })} full>
                  رفع ملف آخر
                </SecondaryButton>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 rounded-lg bg-slate-50 p-5 leading-7 text-slate-600">
              عند رفع ملف، ستظهر هنا عدد الصفوف الصحيحة وأي أخطاء في الأعمدة أو البيانات قبل اعتماد التقرير.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function ReportsView({
  payrollRows,
  reports,
  setReports,
  departments,
  selectedReportId,
  setSelectedReportId,
  reportMonth,
  setReportMonth,
  monthLabel,
  settings,
  selectedSlip,
  setSelectedSlipCode,
  onExcel,
  onBankTransfer,
  onAccounting,
  onPdf,
  onSlipPdf,
  exporting,
  shiftCopy,
  setNotice,
  onNavigate
}) {
  const [reportSearch, setReportSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredRows = useMemo(() => {
    const query = reportSearch.trim().toLowerCase();
    return payrollRows.filter((row) => {
      const matchesSearch = !query
        ? true
        : `${row.employeeCode} ${row.employeeName}`.toLowerCase().includes(query);
      const matchesDepartment =
        departmentFilter === "all" ? true : row.department === departmentFilter;
      const matchesStatus = statusFilter === "all" ? true : row.status.label === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [payrollRows, reportSearch, departmentFilter, statusFilter]);
  const reportTotals = useMemo(
    () => ({
      employees: filteredRows.length,
      net: filteredRows.reduce((sum, row) => sum + row.netSalary, 0),
      deductions: filteredRows.reduce((sum, row) => sum + row.deductions, 0),
      bonuses: filteredRows.reduce((sum, row) => sum + row.bonuses, 0),
      overtime: filteredRows.reduce((sum, row) => sum + row.overtimeBonuses, 0)
    }),
    [filteredRows]
  );

  const handleReportSelect = (event) => {
    const reportId = event.target.value;
    const report = reports.find((item) => item.id === reportId);
    setSelectedReportId(reportId);
    if (report?.month) setReportMonth(report.month);
  };

  const selectedStoredReport = reports.find((item) => item.id === selectedReportId) || reports[0];
  const reportStatus = selectedStoredReport?.status || "draft";
  const approveSelectedReport = () => {
    if (!selectedStoredReport) return;
    setReports(
      reports.map((report) =>
        report.id === selectedStoredReport.id
          ? { ...report, status: "approved", approvedAt: new Date().toISOString() }
          : report
      )
    );
    setNotice("تم اعتماد تقرير الرواتب.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={monthLabel}
        title="تقرير الرواتب"
        description="جدول احترافي قابل للتمرير على الشاشات الكبيرة ويتحول إلى بطاقات واضحة على الجوال."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton
              onClick={() => onExcel(filteredRows)}
              icon={Download}
              disabled={exporting === "excel" || filteredRows.length === 0}
            >
              {exporting === "excel" ? "جاري التصدير" : "Excel"}
            </SecondaryButton>
            <SecondaryButton
              onClick={() => onBankTransfer(filteredRows)}
              icon={Landmark}
              disabled={exporting === "bank" || filteredRows.length === 0}
            >
              {exporting === "bank" ? "جاري التصدير" : "ملف البنك"}
            </SecondaryButton>
            <SecondaryButton
              onClick={() => onAccounting(filteredRows)}
              icon={BookOpen}
              disabled={exporting === "accounting" || filteredRows.length === 0}
            >
              {exporting === "accounting" ? "جاري التصدير" : "قيد محاسبي"}
            </SecondaryButton>
            <PrimaryButton
              onClick={() => onPdf(filteredRows)}
              icon={Printer}
              disabled={exporting === "report" || filteredRows.length === 0}
            >
              {exporting === "report" ? "جاري التصدير" : "PDF"}
            </PrimaryButton>
          </div>
        }
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
          <div>
            <p className="text-xs font-bold text-slate-500">حالة التقرير</p>
            <p className={`mt-1 text-sm font-extrabold ${reportStatus === "approved" ? "text-emerald-700" : "text-amber-700"}`}>
              {reportStatus === "approved" ? "معتمد وجاهز للأرشفة" : "مسودة تحتاج اعتماد"}
            </p>
          </div>
          <PrimaryButton
            type="button"
            icon={CheckCircle2}
            onClick={approveSelectedReport}
            disabled={!selectedStoredReport || reportStatus === "approved"}
          >
            اعتماد التقرير
          </PrimaryButton>
        </div>
        {reports.length > 1 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-ink flex items-center gap-2">
                <Archive size={16} className="text-primary" />
                آخر التقارير
              </h3>
              {reports.length > 3 && (
                <button
                  type="button"
                  onClick={() => onNavigate("archive")}
                  className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                  عرض الكل ({reports.length})
                  <ChevronLeft size={14} />
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {reports.slice(0, 3).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => { setSelectedReportId(report.id); if (report.month) setReportMonth(report.month); }}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-right text-sm font-bold transition ${
                    selectedReportId === report.id || (!selectedReportId && report.id === reports[0]?.id)
                      ? "border-primary bg-white text-primary shadow-sm"
                      : "border-line bg-white text-slate-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  <span>{getMonthLabel(report.month)}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    report.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    report.status === "paid" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {report.status === "approved" ? "معتمد" : report.status === "paid" ? "مدفوع" : "مسودة"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-4">
          <SelectField label="التقرير المحفوظ" value={selectedReportId} onChange={handleReportSelect}>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.fileName} - {getMonthLabel(report.month)}
              </option>
            ))}
          </SelectField>
          <InputField
            label="شهر التقرير"
            type="month"
            value={reportMonth}
            onChange={(event) => setReportMonth(event.target.value)}
          />
          <SelectField
            label="القسم"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="all">كل الأقسام</option>
            {departments.map((department) => (
              <option key={department.id} value={department.name}>
                {department.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="الحالة"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="ملتزم">ملتزم</option>
            <option value="مراجعة">مراجعة</option>
            <option value="متكرر">متكرر</option>
          </SelectField>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <SearchField
            value={reportSearch}
            onChange={(event) => setReportSearch(event.target.value)}
            placeholder="بحث باسم الموظف أو الكود"
          />
          <SecondaryButton
            type="button"
            icon={Filter}
            onClick={() => {
              setReportSearch("");
              setDepartmentFilter("all");
              setStatusFilter("all");
            }}
          >
            مسح الفلاتر
          </SecondaryButton>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ReportTotalCard label="الموظفون" value={formatNumber(reportTotals.employees)} icon={Users} />
        <ReportTotalCard
          label="إجمالي الصافي"
          value={formatCurrency(reportTotals.net, settings.currency)}
          icon={Wallet}
          tone="blue"
        />
        <ReportTotalCard
          label="إجمالي الخصومات"
          value={formatCurrency(reportTotals.deductions, settings.currency)}
          icon={CircleDollarSign}
          tone="rose"
        />
        <ReportTotalCard
          label="إجمالي المكافآت"
          value={formatCurrency(reportTotals.bonuses, settings.currency)}
          icon={Sparkles}
          tone="emerald"
        />
        <ReportTotalCard
          label="وقت إضافي"
          value={formatCurrency(reportTotals.overtime, settings.currency)}
          icon={Clock}
          tone="emerald"
        />
      </div>

      <section className="rounded-lg border border-line bg-white shadow-sm">
        {filteredRows.length ? (
          <>
            <div className="hidden md:block">
              <div className="dashboard-scroll max-h-[620px] overflow-auto rounded-lg">
                <PayrollTable rows={filteredRows} settings={settings} shiftCopy={shiftCopy} onSlip={setSelectedSlipCode} />
              </div>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredRows.map((row) => (
                <PayrollMobileCard
                  key={row.employeeCode}
                  row={row}
                  settings={settings}
                  shiftCopy={shiftCopy}
                  onSlip={setSelectedSlipCode}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FileSpreadsheet}
              title="لا توجد نتائج في التقرير"
              text="جرّب تغيير البحث أو الفلاتر، أو اختر تقريرا محفوظا آخر."
            />
          </div>
        )}
      </section>

      {selectedSlip ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <SalarySlip row={selectedSlip} settings={settings} monthLabel={monthLabel} shiftCopy={shiftCopy} />
          <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-ink">تفاصيل المرتب</h2>
            <p className="mt-3 leading-7 text-slate-600">
              اختر أي موظف من التقرير لعرض تفاصيل المرتب هنا. يمكن تصديرها كملف PDF مستقل
              ومنسق للطباعة.
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={onSlipPdf} icon={Printer} disabled={exporting === "slip"} full>
                {exporting === "slip" ? "جاري تجهيز التفاصيل" : "تحميل تفاصيل PDF"}
              </PrimaryButton>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SettingsView({
  settings,
  setSettings,
  setNotice,
  cloud,
  onCloudLogin,
  onGoogleLogin,
  onCloudLogout,
  onCloudSync,
  onCloudLoad,
  onBackupExport,
  onBackupImport
}) {
  const update = (patch) => setSettings({ ...settings, ...patch });
  const countryProfile = getCountryProfile(settings.country);
  const selectedYear = new Date().getFullYear();
  const holidayOverrides = Array.isArray(settings.holidayOverrides) ? settings.holidayOverrides : [];
  const overrideMap = new Map(holidayOverrides.filter((item) => item.baseKey).map((item) => [item.baseKey, item]));
  const officialHolidays = getOfficialHolidays(countryProfile.code, selectedYear).map((holiday) => {
    const baseKey = getHolidayKey(holiday, countryProfile.code);
    const override = overrideMap.get(baseKey);
    return {
      ...holiday,
      baseKey,
      baseDate: holiday.date,
      date: override?.date || holiday.date,
      name: override?.name || holiday.name,
      enabled: override?.enabled !== false,
      note: override?.note || ""
    };
  });
  const customHolidays = holidayOverrides.filter(
    (holiday) =>
      !holiday.baseKey &&
      holiday.enabled !== false &&
      (!holiday.country || holiday.country === countryProfile.code) &&
      holiday.date?.startsWith(String(selectedYear))
  );
  const effectiveHolidayCount = getEffectiveHolidays(settings, selectedYear).length;
  const [customHoliday, setCustomHoliday] = useState({ name: "", date: "" });

  const changeCountry = (countryCode) => {
    const profile = getCountryProfile(countryCode);
    setSettings({
      ...settings,
      country: profile.code,
      currency: profile.currency,
      workDays: profile.workDays,
      weekends: profile.weekends
    });
    setNotice(`تم ضبط النظام على ${profile.name}.`);
  };

  const toggleDay = (field, key) => {
    const hasDay = settings[field].includes(key);
    update({
      [field]: hasDay ? settings[field].filter((day) => day !== key) : [...settings[field], key]
    });
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ companyLogo: reader.result });
      setNotice("تم حفظ شعار الشركة.");
    };
    reader.readAsDataURL(file);
  };

  const updateHolidayOverride = (holiday, patch) => {
    const nextOverride = {
      country: countryProfile.code,
      baseKey: holiday.baseKey,
      baseDate: holiday.baseDate,
      name: holiday.name,
      date: holiday.date,
      enabled: holiday.enabled,
      note: holiday.note || "",
      ...patch
    };
    update({
      holidayOverrides: [
        ...holidayOverrides.filter((item) => item.baseKey !== holiday.baseKey),
        nextOverride
      ]
    });
    setNotice("تم تحديث الإجازة الرسمية.");
  };

  const addCustomHoliday = (event) => {
    event.preventDefault();
    if (!customHoliday.name.trim() || !customHoliday.date) return;
    update({
      holidayOverrides: [
        ...holidayOverrides,
        {
          id: makeId("holiday"),
          country: countryProfile.code,
          name: customHoliday.name.trim(),
          date: customHoliday.date,
          enabled: true,
          custom: true
        }
      ]
    });
    setCustomHoliday({ name: "", date: "" });
    setNotice("تمت إضافة إجازة مخصصة.");
  };

  const removeCustomHoliday = (holidayId) => {
    update({
      holidayOverrides: holidayOverrides.filter((holiday) => holiday.id !== holidayId)
    });
    setNotice("تم حذف الإجازة المخصصة.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="تهيئة النظام"
        title="الإعدادات"
        description="اضبط بيانات الشركة وأيام العمل وسياسات الخصم التي يستخدمها تقرير الرواتب."
      />

      {cloud.session ? (
        <CloudAccessPanel
          cloud={cloud}
          onLogin={onCloudLogin}
          onGoogleLogin={onGoogleLogin}
          onLogout={onCloudLogout}
          onSync={onCloudSync}
          onLoad={onCloudLoad}
        />
      ) : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-ink">النسخ الاحتياطي</h2>
            <p className="mt-2 leading-7 text-slate-500">
              حمّل نسخة من بيانات الشركة أو استرجع ملف Backup عند النقل بين الأجهزة أو قبل أي تعديل كبير.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={onBackupExport} icon={Download}>
              تحميل نسخة
            </SecondaryButton>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
              <UploadCloud size={18} />
              استرجاع نسخة
              <input className="hidden" type="file" accept=".json" onChange={onBackupImport} />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">بيانات الشركة</h2>
          <div className="mt-5 space-y-4">
            <SelectField
              label="الدولة"
              value={countryProfile.code}
              onChange={(event) => changeCountry(event.target.value)}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} - {country.localeLabel}
                </option>
              ))}
            </SelectField>
            <InputField
              label="اسم الشركة"
              value={settings.companyName}
              onChange={(event) => update({ companyName: event.target.value })}
            />
            <InputField
              label="العملة"
              value={settings.currency}
              onChange={(event) => update({ currency: event.target.value })}
            />
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">شعار الشركة</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm"
              />
            </label>
            {settings.companyLogo ? (
              <div className="flex items-center gap-3 rounded-lg border border-line p-3">
                <img
                  src={settings.companyLogo}
                  alt="شعار الشركة"
                  className="h-14 w-14 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => update({ companyLogo: "" })}
                  className="text-sm font-bold text-rose-600"
                >
                  إزالة الشعار
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">أيام العمل والعطلات</h2>
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm font-bold leading-7 text-blue-900">
            الدولة الحالية: {countryProfile.name}، لغة الواجهة المناسبة: {countryProfile.localeLabel}.
          </div>
          <div className="mt-5 space-y-5">
            <DaySelector
              label="أيام العمل"
              selected={settings.workDays}
              onToggle={(key) => toggleDay("workDays", key)}
            />
            <DaySelector
              label="عطلات نهاية الأسبوع"
              selected={settings.weekends}
              onToggle={(key) => toggleDay("weekends", key)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-xl font-extrabold text-ink">سياسات الرواتب</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <InputField
            label="أيام الشهر الافتراضية للراتب"
            type="number"
            min="1"
            value={settings.payrollMonthDays || 30}
            onChange={(event) => update({ payrollMonthDays: Number(event.target.value) || 30 })}
          />
          <SelectField
            label="سياسة الغياب"
            value={settings.absencePolicy}
            onChange={(event) => update({ absencePolicy: event.target.value })}
          >
            <option value="خصم يوم كامل من الراتب الأساسي">خصم يوم كامل من الراتب الأساسي</option>
            <option value="خصم نصف يوم لأول غياب ثم يوم كامل">خصم نصف يوم لأول غياب ثم يوم كامل</option>
            <option value="عدم الخصم عند وجود رصيد إجازات">عدم الخصم عند وجود رصيد إجازات</option>
          </SelectField>
          <SelectField
            label="إعدادات الرواتب"
            value={settings.payrollSettings}
            onChange={(event) => update({ payrollSettings: event.target.value })}
          >
            <option value="يتم تطبيق رصيد الإجازات تلقائيا قبل خصم الغياب.">
              تطبيق رصيد الإجازات تلقائيا قبل خصم الغياب
            </option>
            <option value="مراجعة يدوية قبل اعتماد أي خصم غياب.">
              مراجعة يدوية قبل اعتماد أي خصم غياب
            </option>
            <option value="اعتماد الخصومات والمكافآت مباشرة بعد رفع الملف.">
              اعتماد الخصومات والمكافآت مباشرة بعد رفع الملف
            </option>
          </SelectField>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-ink">الإجازات الرسمية السنوية</h2>
            <p className="mt-1 text-sm text-slate-500">
              يمكن ترحيل تاريخ الإجازة أو تعطيلها أو إضافة أيام مخصصة حسب قرار الدولة أو الشركة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-primary">
              {countryProfile.name} - {selectedYear}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
              فعال: {formatNumber(effectiveHolidayCount)} يوم
            </span>
          </div>
        </div>
        <form onSubmit={addCustomHoliday} className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_180px_auto]">
          <InputField
            label="إجازة إضافية"
            value={customHoliday.name}
            onChange={(event) => setCustomHoliday({ ...customHoliday, name: event.target.value })}
            placeholder="مثال: عطلة إضافية لعيد الأضحى"
          />
          <InputField
            label="التاريخ"
            type="date"
            value={customHoliday.date}
            onChange={(event) => setCustomHoliday({ ...customHoliday, date: event.target.value })}
          />
          <div className="self-end">
            <PrimaryButton type="submit" icon={Plus}>
              إضافة
            </PrimaryButton>
          </div>
        </form>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {officialHolidays.map((holiday) => (
            <div key={holiday.baseKey} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink">{holiday.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">الأصل: {holiday.baseDate}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={holiday.enabled}
                    onChange={(event) => updateHolidayOverride(holiday, { enabled: event.target.checked })}
                  />
                  تفعيل
                </label>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InputField
                  label="اسم الإجازة"
                  value={holiday.name}
                  onChange={(event) => updateHolidayOverride(holiday, { name: event.target.value })}
                />
                <InputField
                  label="التاريخ الفعلي"
                  type="date"
                  value={holiday.date}
                  onChange={(event) => updateHolidayOverride(holiday, { date: event.target.value })}
                />
              </div>
            </div>
          ))}
          {customHolidays.map((holiday) => (
            <div key={holiday.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-extrabold text-ink">{holiday.name}</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">{holiday.date}</p>
              <button
                type="button"
                onClick={() => removeCustomHoliday(holiday.id)}
                className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-rose-600"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PayrollTable({ rows, settings, shiftCopy, onSlip }) {
  const headers = [
    "الموظف",
    "القسم",
    shiftCopy.definite,
    "الحالة",
    "الحضور",
    "التأخير",
    "الإضافي",
    "ملاحظات",
    "الغياب",
    "الإجازات",
    "الخصومات",
    "المكافآت",
    "الصافي",
    "تفاصيل المرتب"
  ];

  return (
    <table className="w-full min-w-[1320px] border-collapse text-right">
      <thead className="sticky top-0 z-10 bg-slate-50 text-sm text-slate-600">
        <tr>
          {headers.map((header) => (
            <th key={header} className="border-b border-line px-4 py-4 font-extrabold">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((row) => (
          <tr key={row.employeeCode} className="bg-white transition hover:bg-blue-50/40">
            <td className="px-4 py-4">
              <p className="font-extrabold text-ink">{row.employeeName}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{row.employeeCode}</p>
            </td>
            <td className="px-4 py-4 text-sm font-bold text-slate-600">{row.department}</td>
            <td className="px-4 py-4 text-sm text-slate-600">{row.shift}</td>
            <td className="px-4 py-4">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-4 py-4 font-bold">{row.attendanceDays}</td>
            <td className="px-4 py-4 text-sm">
              <span className="font-bold">{row.lateCount}</span>
              <span className="text-slate-400"> / {formatNumber(row.lateMinutes)} د</span>
            </td>
            <td className="px-4 py-4 text-sm font-bold text-emerald-600">
              <span>{formatNumber(row.overtimeMinutes)} د</span>
              <span className="block text-xs text-emerald-500">
                {formatCurrency(row.overtimeBonuses, settings.currency)}
              </span>
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex flex-col gap-1">
                {row.incompleteSplitDays > 0 ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
                    شيفت مقسم غير مكتمل
                  </span>
                ) : null}
                {row.missingPunchDays > 0 ? (
                  <span
                    className={`rounded-full px-3 py-1 font-bold ${
                      row.missingPunchNeedsReview > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    بصمة ناقصة × {row.missingPunchDays}
                    {row.missingPunchNeedsReview > 0 ? " (مراجعة)" : ""}
                  </span>
                ) : null}
                {row.incompleteSplitDays === 0 && row.missingPunchDays === 0 ? (
                  <span className="text-slate-400">-</span>
                ) : null}
              </div>
            </td>
            <td className="px-4 py-4 font-bold text-rose-600">{row.absenceDays}</td>
            <td className="px-4 py-4 font-bold text-emerald-600">{row.vacationUsage}</td>
            <td className="px-4 py-4 font-bold text-rose-600">
              <span className="rounded-full bg-rose-50 px-3 py-1">
                {formatCurrency(row.deductions, settings.currency)}
              </span>
            </td>
            <td className="px-4 py-4 font-bold text-emerald-600">
              <span className="rounded-full bg-emerald-50 px-3 py-1">
                {formatCurrency(row.bonuses, settings.currency)}
              </span>
            </td>
            <td className="px-4 py-4 text-lg font-extrabold text-primary">
              <span className="rounded-full bg-blue-50 px-3 py-1">
                {formatCurrency(row.netSalary, settings.currency)}
              </span>
            </td>
            <td className="px-4 py-4">
              <button
                type="button"
                onClick={() => onSlip(row.employeeCode)}
                className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
              >
                عرض
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PayrollMobileCard({ row, settings, shiftCopy, onSlip }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold text-ink">{row.employeeName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {row.employeeCode} · {row.department}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MetricPill label="الحضور" value={`${row.attendanceDays} يوم`} />
        <MetricPill label={shiftCopy.definite} value={row.shift} />
        <MetricPill label="التأخير" value={`${formatNumber(row.lateMinutes)} د`} />
        <MetricPill label="الإضافي" value={`${formatNumber(row.overtimeMinutes)} د`} />
        <MetricPill label="الغياب" value={`${row.absenceDays} يوم`} />
        <MetricPill label="الإجازات" value={`${row.vacationUsage} يوم`} />
      </div>
      {row.incompleteSplitDays > 0 ? (
        <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          شيفت مقسم غير مكتمل يحتاج مراجعة
        </div>
      ) : null}
      {row.missingPunchDays > 0 ? (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm font-bold ${
            row.missingPunchNeedsReview > 0 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          بصمة ناقصة {row.missingPunchDays} يوم{row.missingPunchNeedsReview > 0 ? " — يحتاج مراجعة يدوية" : ""}
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
        <span className="font-bold text-blue-900">صافي الراتب</span>
        <span className="text-lg font-extrabold text-primary">
          {formatCurrency(row.netSalary, settings.currency)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSlip(row.employeeCode)}
        className="mt-3 w-full rounded-lg border border-line px-4 py-3 font-bold text-slate-700 hover:border-primary hover:text-primary"
      >
        عرض تفاصيل المرتب
      </button>
    </article>
  );
}

function SalarySlip({ row, settings, monthLabel, shiftCopy = getShiftCopy(settings.country), exportMode = false }) {
  const slipNumber = `SP-${row.reportMonth.replace("-", "")}-${row.employeeCode}`;
  const issuedAt = new Date().toLocaleDateString("ar-EG");

  return (
    <article className={exportMode ? "salary-slip" : "rounded-lg border border-line bg-white p-5 shadow-sm"}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-sm font-bold text-primary">تفاصيل المرتب</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">{row.employeeName}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {row.employeeCode} · {row.department} · {monthLabel}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">
            رقم التفاصيل: {slipNumber} · تاريخ الإصدار: {issuedAt}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {settings.companyLogo ? (
            <img src={settings.companyLogo} alt="" className="h-14 w-14 rounded-lg object-contain" />
          ) : (
            <LogoMark />
          )}
          <div>
            <p className="font-extrabold text-ink">{settings.companyName}</p>
            <p className="text-sm text-slate-500">{shiftCopy.definite}: {row.shift}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SlipLine label="الراتب الأساسي" value={formatCurrency(row.salary, settings.currency)} />
        <SlipLine label="أيام الحضور" value={`${row.attendanceDays} يوم`} />
        <SlipLine label="مرات التأخير" value={`${row.lateCount} مرة`} />
        <SlipLine label="دقائق التأخير" value={`${formatNumber(row.lateMinutes)} دقيقة`} />
        <SlipLine label="دقائق إضافية" value={`${formatNumber(row.overtimeMinutes)} دقيقة`} success />
        <SlipLine label="أيام الغياب" value={`${row.absenceDays} يوم`} />
        <SlipLine label="إجازات مستخدمة" value={`${row.vacationUsage} يوم`} />
        <SlipLine label="خصم التأخير" value={formatCurrency(row.lateDeductions, settings.currency)} danger />
        <SlipLine label="خصم الغياب" value={formatCurrency(row.absenceDeductions, settings.currency)} danger />
        {row.missingPunchDays > 0 ? (
          <SlipLine
            label={`خصم بصمة ناقصة (${row.missingPunchDays} يوم)`}
            value={formatCurrency(row.missingPunchDeductions, settings.currency)}
            danger
          />
        ) : null}
        <SlipLine label="خصومات إضافية" value={formatCurrency(row.extraDeductions, settings.currency)} danger />
        <SlipLine label="مكافآت يدوية" value={formatCurrency(row.manualBonuses, settings.currency)} success />
        <SlipLine label="مكافأة الوقت الإضافي" value={formatCurrency(row.overtimeBonuses, settings.currency)} success />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-ink px-5 py-4 text-white">
        <span className="text-lg font-extrabold">صافي الراتب</span>
        <span className="text-2xl font-extrabold">{formatCurrency(row.netSalary, settings.currency)}</span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line p-4">
          <p className="text-xs font-bold text-slate-400">توقيع الموظف</p>
          <div className="mt-8 border-t border-line" />
        </div>
        <div className="rounded-lg border border-dashed border-line p-4">
          <p className="text-xs font-bold text-slate-400">اعتماد الشركة</p>
          <div className="mt-8 border-t border-line" />
        </div>
      </div>
    </article>
  );
}

function ReportExportSurface({ refTarget, rows, settings, monthLabel, shiftCopy = getShiftCopy(settings.country) }) {
  return (
    <div ref={refTarget} className="export-surface">
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-4xl font-extrabold">تقرير الرواتب</h1>
          <p className="mt-2 text-xl text-slate-600">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-4">
          {settings.companyLogo ? (
            <img src={settings.companyLogo} alt="" className="h-20 w-20 object-contain" />
          ) : (
            <LogoMark />
          )}
          <div>
            <p className="text-2xl font-extrabold">{settings.companyName}</p>
            <p className="mt-1 text-slate-500">ShiftPay HR</p>
          </div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {[
              "الكود",
              "الموظف",
              "القسم",
              shiftCopy.definite,
              "الحالة",
              "الحضور",
              "التأخير",
              "الإضافي",
              "ملاحظات",
              "الغياب",
              "الإجازات",
              "الخصومات",
              "المكافآت",
              "الصافي"
            ].map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeCode}>
              <td>{row.employeeCode}</td>
              <td>{row.employeeName}</td>
              <td>{row.department}</td>
              <td>{row.shift}</td>
              <td>{row.status.label}</td>
              <td>{row.attendanceDays}</td>
              <td>
                {row.lateCount} / {formatNumber(row.lateMinutes)} د
              </td>
              <td>{formatNumber(row.overtimeMinutes)} د</td>
              <td>
                {[
                  row.incompleteSplitDays > 0 ? "شيفت مقسم غير مكتمل" : "",
                  row.missingPunchDays > 0 ? `بصمة ناقصة × ${row.missingPunchDays}` : ""
                ]
                  .filter(Boolean)
                  .join(" / ") || "-"}
              </td>
              <td>{row.absenceDays}</td>
              <td>{row.vacationUsage}</td>
              <td>{formatCurrency(row.deductions, settings.currency)}</td>
              <td>{formatCurrency(row.bonuses, settings.currency)}</td>
              <td>{formatCurrency(row.netSalary, settings.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeCard({
  employee,
  departments,
  shifts,
  shiftCopy,
  isEditing,
  editForm,
  onEditFormChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onArchive,
  onRestore
}) {
  const department = departments.find((item) => item.id === employee.departmentId)?.name || "غير محدد";
  const shift = shifts.find((item) => item.id === employee.shiftId)?.name || "غير محدد";

  return (
    <article className="rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-ink">{employee.name}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{employee.code}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
            employee.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {employee.active ? "نشط" : "مؤرشف"}
        </span>
      </div>
      {employee.jobTitle && (
        <p className="mt-1 text-xs font-bold text-primary">{employee.jobTitle}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span>{department}</span>
        <span>•</span>
        <span>{shiftCopy.definite}: {shift}</span>
        {employee.hireDate && (
          <>
            <span>•</span>
            <span>منذ {new Date(employee.hireDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
          </>
        )}
      </div>
      {employee.salaryHistory?.length > 0 && !isEditing && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-400 hover:text-primary">
            سجل الراتب ({employee.salaryHistory.length} تغيير)
          </summary>
          <div className="mt-2 space-y-1">
            {employee.salaryHistory.slice(-3).reverse().map((h, i) => (
              <p key={i} className="text-xs text-slate-500">
                {h.date}: من {h.from.toLocaleString()} إلى <span className="font-bold text-ink">{h.to.toLocaleString()}</span> ج
              </p>
            ))}
          </div>
        </details>
      )}
      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveEdit();
          }}
          className="mt-4 rounded-lg border border-line bg-slate-50 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="القسم"
              value={editForm.departmentId}
              onChange={(event) => onEditFormChange({ ...editForm, departmentId: event.target.value })}
            >
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={shiftCopy.definite}
              value={editForm.shiftId}
              onChange={(event) => onEditFormChange({ ...editForm, shiftId: event.target.value })}
            >
              {shifts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <InputField
              label="الراتب الأساسي"
              type="number"
              value={editForm.salary}
              onChange={(event) => onEditFormChange({ ...editForm, salary: event.target.value })}
            />
            <InputField
              label="رصيد الإجازات"
              type="number"
              value={editForm.vacationBalance}
              onChange={(event) => onEditFormChange({ ...editForm, vacationBalance: event.target.value })}
            />
            <InputField
              label="مكافآت"
              type="number"
              value={editForm.bonuses}
              onChange={(event) => onEditFormChange({ ...editForm, bonuses: event.target.value })}
            />
            <InputField
              label="خصومات إضافية"
              type="number"
              value={editForm.extraDeductions}
              onChange={(event) => onEditFormChange({ ...editForm, extraDeductions: event.target.value })}
            />
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">ملاحظات</span>
              <textarea
                value={editForm.notes}
                onChange={(event) => onEditFormChange({ ...editForm, notes: event.target.value })}
                className="min-h-20 w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton type="submit" icon={Save}>
              حفظ
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onCancelEdit}>
              إلغاء
            </SecondaryButton>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton type="button" onClick={onEdit} icon={Pencil}>
            تعديل
          </SecondaryButton>
          {employee.active ? (
            <SecondaryButton type="button" onClick={onArchive} icon={Archive}>
              أرشفة
            </SecondaryButton>
          ) : (
            <SecondaryButton type="button" onClick={onRestore} icon={RotateCcw}>
              استعادة
            </SecondaryButton>
          )}
        </div>
      )}
    </article>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-extrabold text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-500">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-primary",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-extrabold text-ink">{formatNumber(value)}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={24} />
        </span>
      </div>
    </article>
  );
}

function ReportTotalCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    blue: "bg-blue-50 text-primary",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600"
  };

  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-1 break-words text-xl font-extrabold text-ink">{value}</p>
        </div>
      </div>
    </article>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words font-extrabold text-ink">{value}</p>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="relative block w-full min-w-[220px]">
      <Search
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white py-3 pl-4 pr-11 text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">{text}</p>
    </div>
  );
}

function SlipLine({ label, value, danger = false, success = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
      <span className="font-bold text-slate-600">{label}</span>
      <span
        className={`text-left font-extrabold ${
          danger ? "text-rose-600" : success ? "text-emerald-600" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    yellow: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100"
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${
        classes[status.tone]
      }`}
    >
      <BadgeCheck size={14} />
      {status.label}
    </span>
  );
}

function CloudMiniStatus({ cloud, onNavigate }) {
  const status = cloud.configured
    ? cloud.session
      ? "متصل بالسحابة"
      : "سجّل الدخول"
    : "الحسابات غير مفعلة";

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-right transition hover:border-primary"
    >
      <p className="text-sm font-bold text-blue-900">{status}</p>
      <p className="mt-1 text-sm leading-6 text-blue-800">
        {cloud.session
          ? `آخر مزامنة: ${cloud.lastSyncAt ? new Date(cloud.lastSyncAt).toLocaleString("ar-EG") : "لم تتم بعد"}`
          : cloud.configured
            ? "سجّل الدخول لتفعيل الحفظ السحابي وحسابات الشركات."
            : "يجب تفعيل الحسابات السحابية قبل استخدام النظام."}
      </p>
    </button>
  );
}

function CloudTopBar({ cloud, onSync, onLogout, onNavigate }) {
  const title = cloud.session
    ? "الحساب السحابي مفعل"
    : cloud.configured
      ? "سجّل الدخول لحفظ بياناتك"
      : "الحسابات غير مفعلة";
  const description = cloud.session
    ? "يمكنك حفظ وتحميل البيانات مع عزل بيانات كل شركة."
    : cloud.configured
      ? "استخدم البريد الإلكتروني أو Gmail لتفعيل المزامنة وحفظ التقارير."
      : "يجب تفعيل الحسابات السحابية قبل استقبال العملاء.";

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-extrabold text-ink">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {cloud.session ? (
          <SecondaryButton type="button" onClick={onSync} icon={Save} disabled={cloud.loading}>
            {cloud.loading ? "جاري المزامنة" : "حفظ سحابي"}
          </SecondaryButton>
        ) : null}
        {cloud.session ? (
          <SecondaryButton type="button" onClick={onLogout} icon={LogOut}>
            تسجيل خروج
          </SecondaryButton>
        ) : null}
        <SecondaryButton type="button" onClick={onNavigate} icon={Settings}>
          حساب الشركة
        </SecondaryButton>
      </div>
    </div>
  );
}

function SiteContentPanel({ siteContent, setSiteContent, onSave, loading, setNotice }) {
  const landing = siteContent.landing || DEFAULT_SITE_CONTENT.landing;
  const update = (patch) => setSiteContent({ ...siteContent, ...patch });
  const updateLanding = (patch) => setSiteContent({ ...siteContent, landing: { ...landing, ...patch } });

  const updateHeroTrust = (index, value) => {
    const next = [...(landing.heroTrust || DEFAULT_SITE_CONTENT.landing.heroTrust)];
    next[index] = value;
    updateLanding({ heroTrust: next });
  };

  const updateCardItem = (key, index, field, value) => {
    const list = [...(landing[key] || DEFAULT_SITE_CONTENT.landing[key] || [])];
    list[index] = { ...list[index], [field]: value };
    updateLanding({ [key]: list });
  };

  const updatePricingTier = (tierKey, field, value) => {
    const tier = { ...(landing[tierKey] || DEFAULT_SITE_CONTENT.landing[tierKey] || {}) };
    if (field === "features") {
      tier.features = value.split("\n").map((line) => line.trim()).filter(Boolean);
    } else {
      tier[field] = value;
    }
    updateLanding({ [tierKey]: tier });
  };

  const handleSiteLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ logo: reader.result });
      setNotice("تم تحديث شعار الموقع.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-primary">إدارة الموقع</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">لوحة تحكم واجهة العملاء</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-500">
            عدل نصوص الصفحة الرئيسية وبيانات التواصل والشعار من هنا، ثم احفظها حتى تظهر على نسخة اللايف.
          </p>
        </div>
        <PrimaryButton type="button" onClick={onSave} icon={Save} disabled={loading}>
          {loading ? "جاري الحفظ" : "حفظ على اللايف"}
        </PrimaryButton>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="عنوان الصفحة الرئيسية"
            value={siteContent.heroTitle}
            onChange={(event) => update({ heroTitle: event.target.value })}
          />
          <InputField
            label="الشارة أعلى العنوان"
            value={siteContent.heroBadge}
            onChange={(event) => update({ heroBadge: event.target.value })}
          />
          <InputField
            label="زر إنشاء الحساب"
            value={siteContent.primaryCta}
            onChange={(event) => update({ primaryCta: event.target.value })}
          />
          <InputField
            label="زر تسجيل الدخول"
            value={siteContent.secondaryCta}
            onChange={(event) => update({ secondaryCta: event.target.value })}
          />
          <InputField
            label="رقم الدعم"
            value={siteContent.supportPhone}
            onChange={(event) => update({ supportPhone: event.target.value })}
          />
          <InputField
            label="بريد الدعم"
            type="email"
            value={siteContent.supportEmail}
            onChange={(event) => update({ supportEmail: event.target.value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="وصف الصفحة الرئيسية"
              value={siteContent.heroText}
              onChange={(event) => update({ heroText: event.target.value })}
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label="نص الفوتر"
              value={siteContent.footerText}
              onChange={(event) => update({ footerText: event.target.value })}
              rows={3}
            />
          </div>
          <InputField
            label="نص الدعم"
            value={siteContent.supportText}
            onChange={(event) => update({ supportText: event.target.value })}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">شعار الموقع</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleSiteLogo}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>

        <div className="rounded-lg border border-line bg-slate-50 p-4">
          <p className="mb-4 font-extrabold text-ink">معاينة سريعة</p>
          <div className="rounded-lg bg-ink p-5 text-white">
            <BrandBlock siteContent={siteContent} light />
            <div className="mt-6 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100">
              {siteContent.heroBadge}
            </div>
            <h3 className="mt-4 text-3xl font-extrabold">{siteContent.heroTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{siteContent.heroText}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <span className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-extrabold">
                {siteContent.primaryCta}
              </span>
              <span className="rounded-lg border border-white/20 px-4 py-3 text-center text-sm font-extrabold">
                {siteContent.secondaryCta}
              </span>
            </div>
          </div>
          {siteContent.logo ? (
            <button
              type="button"
              onClick={() => update({ logo: "" })}
              className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-600"
            >
              إزالة شعار الموقع
            </button>
          ) : null}
        </div>
      </div>

      {/* Hero highlight + trust badges */}
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-lg font-extrabold text-ink">تفاصيل إضافية للعنوان الرئيسي</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="الكلمة/الجملة المميزة داخل العنوان (تُلوّن تلقائياً)"
            value={siteContent.heroHighlight || ""}
            onChange={(event) => update({ heroHighlight: event.target.value })}
          />
          {(landing.heroTrust || DEFAULT_SITE_CONTENT.landing.heroTrust).map((text, index) => (
            <InputField
              key={index}
              label={`عنصر الثقة رقم ${index + 1}`}
              value={text}
              onChange={(event) => updateHeroTrust(index, event.target.value)}
            />
          ))}
        </div>
      </div>

      {/* Before / After comparison section */}
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-lg font-extrabold text-ink">قسم "الطريقة القديمة مقابل ShiftPay"</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InputField
            label="شارة القسم"
            value={landing.comparisonBadge}
            onChange={(event) => updateLanding({ comparisonBadge: event.target.value })}
          />
          <InputField
            label="عنوان القسم"
            value={landing.comparisonTitle}
            onChange={(event) => updateLanding({ comparisonTitle: event.target.value })}
          />
          <InputField
            label="وصف القسم"
            value={landing.comparisonDesc}
            onChange={(event) => updateLanding({ comparisonDesc: event.target.value })}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line p-4">
            <InputField
              label="عنوان العمود القديم"
              value={landing.comparisonOldLabel}
              onChange={(event) => updateLanding({ comparisonOldLabel: event.target.value })}
            />
            <div className="mt-3 space-y-3">
              {(landing.comparisonOld || DEFAULT_SITE_CONTENT.landing.comparisonOld).map((item, index) => (
                <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3">
                  <InputField
                    label={`عنوان بطاقة ${index + 1}`}
                    value={item.title}
                    onChange={(event) => updateCardItem("comparisonOld", index, "title", event.target.value)}
                  />
                  <TextareaField
                    label="الوصف"
                    rows={2}
                    value={item.desc}
                    onChange={(event) => updateCardItem("comparisonOld", index, "desc", event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line p-4">
            <InputField
              label="عنوان العمود الجديد"
              value={landing.comparisonNewLabel}
              onChange={(event) => updateLanding({ comparisonNewLabel: event.target.value })}
            />
            <div className="mt-3 space-y-3">
              {(landing.comparisonNew || DEFAULT_SITE_CONTENT.landing.comparisonNew).map((item, index) => (
                <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3">
                  <InputField
                    label={`عنوان بطاقة ${index + 1}`}
                    value={item.title}
                    onChange={(event) => updateCardItem("comparisonNew", index, "title", event.target.value)}
                  />
                  <TextareaField
                    label="الوصف"
                    rows={2}
                    value={item.desc}
                    onChange={(event) => updateCardItem("comparisonNew", index, "desc", event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-lg font-extrabold text-ink">قسم المميزات</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InputField
            label="شارة القسم"
            value={landing.featuresBadge}
            onChange={(event) => updateLanding({ featuresBadge: event.target.value })}
          />
          <InputField
            label="عنوان القسم"
            value={landing.featuresTitle}
            onChange={(event) => updateLanding({ featuresTitle: event.target.value })}
          />
          <InputField
            label="وصف القسم"
            value={landing.featuresDesc}
            onChange={(event) => updateLanding({ featuresDesc: event.target.value })}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(landing.features || DEFAULT_SITE_CONTENT.landing.features).map((item, index) => (
            <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3">
              <InputField
                label={`عنوان الميزة ${index + 1}`}
                value={item.title}
                onChange={(event) => updateCardItem("features", index, "title", event.target.value)}
              />
              <TextareaField
                label="الوصف"
                rows={2}
                value={item.desc}
                onChange={(event) => updateCardItem("features", index, "desc", event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing section */}
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-lg font-extrabold text-ink">قسم الأسعار</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InputField
            label="شارة القسم"
            value={landing.pricingBadge}
            onChange={(event) => updateLanding({ pricingBadge: event.target.value })}
          />
          <InputField
            label="عنوان القسم"
            value={landing.pricingTitle}
            onChange={(event) => updateLanding({ pricingTitle: event.target.value })}
          />
          <InputField
            label="وصف القسم"
            value={landing.pricingDesc}
            onChange={(event) => updateLanding({ pricingDesc: event.target.value })}
          />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {[
            { key: "pricingBasic", label: "الباقة الأساسية" },
            { key: "pricingPro", label: "الباقة الاحترافية" },
            { key: "pricingBusiness", label: "باقة الأعمال" }
          ].map(({ key, label }) => {
            const tier = landing[key] || DEFAULT_SITE_CONTENT.landing[key] || {};
            return (
              <div key={key} className="grid gap-2 rounded-lg border border-line p-4">
                <p className="text-sm font-extrabold text-primary">{label}</p>
                <InputField
                  label="اسم الباقة"
                  value={tier.name}
                  onChange={(event) => updatePricingTier(key, "name", event.target.value)}
                />
                <InputField
                  label="وصف الباقة"
                  value={tier.desc}
                  onChange={(event) => updatePricingTier(key, "desc", event.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <InputField
                    label="السعر"
                    value={tier.amount}
                    onChange={(event) => updatePricingTier(key, "amount", event.target.value)}
                  />
                  <InputField
                    label="الفترة"
                    value={tier.period}
                    onChange={(event) => updatePricingTier(key, "period", event.target.value)}
                  />
                </div>
                {key === "pricingPro" ? (
                  <InputField
                    label="شارة (مثال: الأكثر طلباً)"
                    value={tier.badge || ""}
                    onChange={(event) => updatePricingTier(key, "badge", event.target.value)}
                  />
                ) : null}
                <InputField
                  label="نص الزر"
                  value={tier.cta}
                  onChange={(event) => updatePricingTier(key, "cta", event.target.value)}
                />
                <TextareaField
                  label="المزايا (سطر لكل ميزة)"
                  rows={5}
                  value={(tier.features || []).join("\n")}
                  onChange={(event) => updatePricingTier(key, "features", event.target.value)}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border border-line p-4 md:grid-cols-3">
          <InputField
            label="عنوان باقة المؤسسات"
            value={landing.pricingEnterpriseTitle}
            onChange={(event) => updateLanding({ pricingEnterpriseTitle: event.target.value })}
          />
          <TextareaField
            label="وصف باقة المؤسسات"
            rows={2}
            value={landing.pricingEnterpriseDesc}
            onChange={(event) => updateLanding({ pricingEnterpriseDesc: event.target.value })}
          />
          <InputField
            label="نص زر التواصل"
            value={landing.pricingEnterpriseCta}
            onChange={(event) => updateLanding({ pricingEnterpriseCta: event.target.value })}
          />
        </div>
      </div>

      {/* Final CTA + Footer */}
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-lg font-extrabold text-ink">قسم الدعوة النهائية والفوتر</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="عنوان الدعوة النهائية"
            value={landing.ctaTitle}
            onChange={(event) => updateLanding({ ctaTitle: event.target.value })}
          />
          <InputField
            label="نص زر الدعوة النهائية"
            value={landing.ctaButton}
            onChange={(event) => updateLanding({ ctaButton: event.target.value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="وصف الدعوة النهائية"
              rows={2}
              value={landing.ctaDesc}
              onChange={(event) => updateLanding({ ctaDesc: event.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label="وصف الفوتر (تحت الشعار)"
              rows={2}
              value={landing.footerBrandDesc}
              onChange={(event) => updateLanding({ footerBrandDesc: event.target.value })}
            />
          </div>
          <InputField
            label="نص حقوق الملكية"
            value={landing.footerCopyright}
            onChange={(event) => updateLanding({ footerCopyright: event.target.value })}
          />
          <InputField
            label="شعار الفوتر الجانبي"
            value={landing.footerTagline}
            onChange={(event) => updateLanding({ footerTagline: event.target.value })}
          />
        </div>
      </div>
    </section>
  );
}

function CloudAccessPanel({ cloud, onLogin, onGoogleLogin, onLogout, onSync, onLoad }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", companyName: "شركة المسار الذكي" });
  const cloudStatusLabel = cloud.configured ? "الحسابات جاهزة" : "الحسابات غير مفعلة";

  const submit = (event) => {
    event.preventDefault();
    onLogin({ mode, ...form });
  };

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-primary">حساب الشركة</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">حساب الشركة والمزامنة</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-500">
            تابع الحساب الحالي واحفظ بيانات الشركة والتقارير وسجل التعديلات على السحابة.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            cloud.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {cloudStatusLabel}
        </span>
      </div>

      {!cloud.configured ? (
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 leading-7 text-blue-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <p className="font-extrabold text-ink">الحسابات السحابية غير مفعلة حاليا</p>
              <p className="mt-1 text-sm leading-7 text-blue-900">
                يجب تفعيل تسجيل الدخول من إعدادات الاستضافة قبل استقبال العملاء.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!cloud.configured ? null : cloud.session ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-extrabold text-ink">الحساب الحالي</p>
            <p className="mt-2 text-sm font-bold text-slate-600">{cloud.user?.email}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricPill label="الشركات" value={cloud.companies.length || 1} />
              <MetricPill
                label="آخر مزامنة"
                value={cloud.lastSyncAt ? new Date(cloud.lastSyncAt).toLocaleString("ar-EG") : "لم تتم"}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={onSync} icon={Save} disabled={cloud.loading}>
                حفظ البيانات للسحابة
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => onLoad()} icon={Download} disabled={cloud.loading}>
                تحميل من السحابة
              </SecondaryButton>
              <SecondaryButton type="button" onClick={onLogout}>
                خروج
              </SecondaryButton>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-extrabold text-ink">سجل التعديلات</p>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto">
              {cloud.auditLogs.length ? (
                cloud.auditLogs.map((log) => (
                  <div key={log.id} className="rounded-lg bg-white p-3 text-sm">
                    <p className="font-bold text-ink">{log.action}</p>
                    <p className="mt-1 text-slate-500">
                      {new Date(log.created_at).toLocaleString("ar-EG")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-slate-500">لا يوجد سجل تعديلات بعد.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-line bg-slate-50 p-4">
            <p className="font-extrabold text-ink">تسجيل سريع</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              يمكن الدخول بحساب Gmail أو البريد الإلكتروني بعد تفعيل بيانات الحساب.
            </p>
            <div className="mt-4">
              <SecondaryButton type="button" onClick={onGoogleLogin} icon={Mail} disabled={!cloud.configured || cloud.loading}>
                الدخول باستخدام Gmail
              </SecondaryButton>
            </div>
          </div>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <InputField
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <InputField
              label="كلمة المرور"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            {mode === "signup" ? (
              <InputField
                label="اسم الشركة"
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                required
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" icon={Users} disabled={cloud.loading || !cloud.configured}>
                {mode === "signup" ? "إنشاء حساب" : "دخول"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "لدي حساب" : "حساب جديد"}
              </SecondaryButton>
            </div>
          </form>
        </div>
      )}

      {cloud.error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {cloud.error}
        </div>
      ) : null}
    </section>
  );
}

function InputField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextareaField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <textarea
        {...props}
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function DaySelector({ label, selected, onToggle }) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WEEK_DAYS.map((day) => (
          <button
            key={day.key}
            type="button"
            onClick={() => onToggle(day.key)}
            className={`rounded-lg border px-3 py-3 text-sm font-extrabold ${
              selected.includes(day.key)
                ? "border-primary bg-blue-50 text-primary"
                : "border-line bg-white text-slate-500"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrimaryButton({ children, icon: Icon, full = false, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60 ${
        full ? "w-full" : ""
      } ${className}`}
    >
      {Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({ children, icon: Icon, full = false, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 font-bold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-60 ${
        full ? "w-full" : ""
      } ${className}`}
    >
      {Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}

function NavButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-right font-bold transition ${
        active ? "bg-primary text-white shadow-lg shadow-blue-100" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <item.icon size={20} />
      <span>{item.label}</span>
    </button>
  );
}

function LogoMark({ light = false }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
        light ? "bg-white text-primary" : "bg-primary text-white"
      }`}
      aria-hidden="true"
    >
      <Wallet size={23} />
    </span>
  );
}