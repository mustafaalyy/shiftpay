import React, { useState } from "react";
import {
  User,
  Key,
  Lock,
  LogIn,
  LogOut,
  Send,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Share2,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Building2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  QrCode
} from "lucide-react";
import { formatCurrency, formatNumber } from "../lib/payroll";
import { generateWhatsAppSlipMessage, openWhatsAppSlip } from "../lib/exporters";

export default function EmployeePortalView({
  employees = [],
  payrollRows = [],
  advances = [],
  requests = [],
  settings = {},
  monthLabel = "",
  onSubmitRequest,
  onReturnToAdmin,
  lang = "ar"
}) {
  const expectedCompanyCode = (settings.companyCode || "MASAR").toUpperCase();

  // Detect company code from URL query parameters (e.g. ?c=MASAR#portal or #portal?c=MASAR)
  const urlCompanyParam = (() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const fromSearch = searchParams.get("c") || searchParams.get("company");
      if (fromSearch) return fromSearch.trim().toUpperCase();
      const hashParts = window.location.hash.split("?");
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        const fromHash = hashParams.get("c") || hashParams.get("company");
        if (fromHash) return fromHash.trim().toUpperCase();
      }
    } catch {}
    return "";
  })();

  const [boundCompanyCode, setBoundCompanyCode] = useState(() => {
    if (urlCompanyParam) {
      try { localStorage.setItem("shiftpay.portalCompanyCode", urlCompanyParam); } catch {}
      return urlCompanyParam;
    }
    try {
      return localStorage.getItem("shiftpay.portalCompanyCode") || "";
    } catch {
      return "";
    }
  });

  const [companyCodeInput, setCompanyCodeInput] = useState(() => {
    return boundCompanyCode || "";
  });

  const [loggedEmployeeCode, setLoggedEmployeeCode] = useState(() => {
    return localStorage.getItem("shiftpay.portalEmployeeCode") || "";
  });
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("slip"); // "slip" | "requests" | "profile"

  // Form states for new request
  const [requestType, setRequestType] = useState("leave");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestDays, setRequestDays] = useState(1);
  const [requestHours, setRequestHours] = useState(2);
  const [requestAmount, setRequestAmount] = useState(1500);
  const [requestReason, setRequestReason] = useState("");
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isEn = lang === "en";
  const currency = settings.currency || (isEn ? "EGP" : "جنيه");

  const currentEmployee = employees.find(
    (e) => e.code.toLowerCase() === loggedEmployeeCode.toLowerCase()
  );

  const currentPayrollRow = payrollRows.find(
    (r) => r.employeeCode?.toLowerCase() === loggedEmployeeCode.toLowerCase()
  );

  const handleClearCompany = () => {
    setBoundCompanyCode("");
    setCompanyCodeInput("");
    try { localStorage.removeItem("shiftpay.portalCompanyCode"); } catch {}
    setLoginError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    // 1. Resolve & Validate Company Code
    const effectiveCompany = (boundCompanyCode || companyCodeInput).trim().toUpperCase();
    if (!effectiveCompany) {
      setLoginError(isEn ? "Please enter your company code." : "يرجى إدخال كود الشركة للوصول لملف شركتك.");
      return;
    }

    if (effectiveCompany !== expectedCompanyCode) {
      setLoginError(
        isEn
          ? `Company code "${effectiveCompany}" not found on this server. (Active demo code: ${expectedCompanyCode})`
          : `كود الشركة "${effectiveCompany}" غير مسجل على هذا النظام. تأكد من كود شركتك (كود التجربة: ${expectedCompanyCode}) أو استخدم الرابط المباشر.`
      );
      return;
    }

    // 2. Validate Employee Credentials within Company
    const found = employees.find((emp) => {
      const matchCode = emp.code.toLowerCase() === loginInput.trim().toLowerCase();
      const matchEmail = emp.email && emp.email.toLowerCase() === loginInput.trim().toLowerCase();
      return matchCode || matchEmail;
    });

    if (!found) {
      setLoginError(
        isEn
          ? `Employee "${loginInput}" not found under company ${effectiveCompany}.`
          : `كود الموظف أو البريد "${loginInput}" غير مسجل في شركة ${settings.companyName || effectiveCompany}.`
      );
      return;
    }

    const expectedPassword = found.portalPassword || "1234";
    if (passwordInput.trim() !== expectedPassword && passwordInput.trim() !== found.code) {
      setLoginError(isEn ? "Incorrect PIN / password. (Default is 1234)" : "كلمة المرور أو الـ PIN غير صحيحة. (الافتراضية: 1234)");
      return;
    }

    setBoundCompanyCode(effectiveCompany);
    try {
      localStorage.setItem("shiftpay.portalCompanyCode", effectiveCompany);
      localStorage.setItem("shiftpay.portalEmployeeCode", found.code);
    } catch {}
    setLoggedEmployeeCode(found.code);
    setLoginInput("");
    setPasswordInput("");
  };

  const handleLogout = () => {
    setLoggedEmployeeCode("");
    try { localStorage.removeItem("shiftpay.portalEmployeeCode"); } catch {}
  };

  const handleQuickFill = (code, pass = "1234") => {
    setCompanyCodeInput(expectedCompanyCode);
    setBoundCompanyCode(expectedCompanyCode);
    try { localStorage.setItem("shiftpay.portalCompanyCode", expectedCompanyCode); } catch {}
    setLoginInput(code);
    setPasswordInput(pass);
    setLoginError("");
  };

  const handleSubmitNewRequest = (e) => {
    e.preventDefault();
    if (!onSubmitRequest || !currentEmployee) return;

    let typeLabelAr = "طلب إجازة اعتيادية";
    let typeLabelEn = "Annual Leave Request";
    let details = `${isEn ? "Duration" : "المدة"}: ${requestDays} ${isEn ? "days" : "يوم"} • ${requestReason}`;

    if (requestType === "advance") {
      typeLabelAr = "طلب سلفة مالية";
      typeLabelEn = "Salary Advance Request";
      details = `${isEn ? "Amount" : "المبلغ"}: ${formatCurrency(requestAmount, currency)} • ${requestReason}`;
    } else if (requestType === "permission") {
      typeLabelAr = "إذن انصراف مبكر";
      typeLabelEn = "Early Departure Permission";
      details = `${isEn ? "Hours" : "الساعات"}: ${requestHours} ${isEn ? "hours" : "ساعات"} • ${requestReason}`;
    }

    const newReq = {
      id: `req-${Date.now()}`,
      employeeCode: currentEmployee.code,
      employeeName: currentEmployee.name,
      employeeId: currentEmployee.id,
      department: currentEmployee.department || "عام",
      type: requestType,
      typeLabelAr,
      typeLabelEn,
      date: requestDate,
      days: requestType === "leave" ? requestDays : null,
      hours: requestType === "permission" ? requestHours : null,
      amount: requestType === "advance" ? requestAmount : null,
      details,
      status: "pending_manager",
      currentStage: isEn ? "Direct Manager" : "المدير المباشر",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      history: [
        {
          step: "submitted",
          by: currentEmployee.name,
          at: new Date().toISOString().slice(0, 16).replace("T", " "),
          note: requestReason || (isEn ? "Submitted via ESS Portal" : "تقديم عبر بوابة الموظف")
        }
      ]
    };

    onSubmitRequest(newReq);
    setRequestReason("");
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  // Filter requests for current employee
  const myRequests = (requests || []).filter(
    (req) => req.employeeCode?.toLowerCase() === loggedEmployeeCode.toLowerCase()
  );

  // Active advance for this employee
  const activeAdvance = (advances || []).find(
    (adv) => adv.employeeCode?.toLowerCase() === loggedEmployeeCode.toLowerCase() && adv.status === "active"
  );

  // LOGIN SCREEN
  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white mx-auto shadow-lg">
              <Smartphone size={28} />
            </div>
            <h1 className="text-xl font-black text-ink dark:text-white">
              {isEn ? "Employee Self-Service Portal" : "بوابة الخدمة الذاتية للموظفين (ESS)"}
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {settings.companyName || "ShiftPay HR"} • {isEn ? "Sign in to view payslips and submit requests" : "سجل الدخول لمتابعة مسير راتبك ورصيد إجازاتك وتقديم الطلبات"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Company Workspace Binding / Selector */}
            {boundCompanyCode ? (
              <div className="flex items-center justify-between rounded-2xl bg-blue-50/80 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <span className="font-black text-ink dark:text-white block">
                      {settings.companyName || "ShiftPay HR"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {isEn ? "Company Code" : "كود الشركة"}: <strong className="text-primary font-mono">{boundCompanyCode}</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCompany}
                  className="text-[11px] font-black text-slate-500 hover:text-rose-600 transition underline cursor-pointer"
                  title={isEn ? "Switch to another company workspace" : "التبديل إلى شركة أخرى"}
                >
                  {isEn ? "Switch" : "تغيير"}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? "Company Code" : "كود الشركة (Company Code)"}
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={companyCodeInput}
                    onChange={(e) => setCompanyCodeInput(e.target.value.toUpperCase())}
                    placeholder={isEn ? "e.g. MASAR" : "مثال: MASAR"}
                    className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-10 py-3 text-xs font-black text-ink dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-primary uppercase font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                  {isEn ? "Ask your HR for your company code or scan your QR code." : "كود مخصص لشركتك لمنع التداخل مع الشركات الأخرى (مثال التجربة: MASAR)."}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? "Employee Code or Email" : "كود الموظف أو البريد الإلكتروني"}
              </label>
              <div className="relative">
                <User size={16} className="absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder={isEn ? "e.g. E001 or E003" : "مثال: E001 أو E003"}
                  className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-10 py-3 text-xs font-black text-ink dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? "Password / PIN" : "كلمة المرور / الـ PIN"}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-10 py-3 text-xs font-black text-ink dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-primary"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-700 text-white py-3 text-xs font-black transition shadow-md"
            >
              <LogIn size={16} />
              <span>{isEn ? "Sign in to Portal" : "تسجيل الدخول للبوابة"}</span>
            </button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="pt-2 border-t border-line dark:border-slate-700">
            <span className="block text-[11px] font-bold text-slate-400 text-center mb-2">
              {isEn ? "Quick Demo Login (Default PIN: 1234)" : "تجربة سريعة (الـ PIN الافتراضي: 1234)"}:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("E001", "1234")}
                className="rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-[11px] font-black text-slate-700 dark:text-slate-300 hover:border-primary transition text-center"
              >
                أحمد محمود (E001)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("E003", "1234")}
                className="rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-[11px] font-black text-slate-700 dark:text-slate-300 hover:border-primary transition text-center"
              >
                محمود حسن (E003)
              </button>
            </div>
          </div>

          {/* Back to Admin */}
          {onReturnToAdmin && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onReturnToAdmin}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isEn ? "← Return to Admin Dashboard" : "← العودة إلى لوحة تحكم الإدارة"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED PORTAL VIEW
  const netSalary = currentPayrollRow?.netSalary || currentEmployee.salary || 0;
  const basicSalary = currentPayrollRow?.salary || currentEmployee.salary || 0;
  const overtimeBonuses = currentPayrollRow?.overtimeBonuses || 0;
  const deductions = currentPayrollRow?.deductions || 0;
  const advanceInstallment = currentPayrollRow?.advanceInstallment || 0;

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppSlipMessage({
      row: currentPayrollRow || {
        employeeName: currentEmployee.name,
        employeeCode: currentEmployee.code,
        department: currentEmployee.department,
        salary: basicSalary,
        overtimeBonuses,
        bonuses: 0,
        deductions,
        advanceInstallment,
        advanceInstallmentLabel: "",
        netSalary
      },
      monthLabel,
      currency,
      companyName: settings.companyName || "ShiftPay HR"
    });
    openWhatsAppSlip({ phone: currentEmployee.phone, message });
  };

  const handleCopyText = () => {
    const message = generateWhatsAppSlipMessage({
      row: currentPayrollRow || {
        employeeName: currentEmployee.name,
        employeeCode: currentEmployee.code,
        department: currentEmployee.department,
        salary: basicSalary,
        overtimeBonuses,
        bonuses: 0,
        deductions,
        advanceInstallment,
        advanceInstallmentLabel: "",
        netSalary
      },
      monthLabel,
      currency,
      companyName: settings.companyName || "ShiftPay HR"
    });
    navigator.clipboard?.writeText(message);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 pb-20">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-black text-lg shadow-xs">
              {currentEmployee.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-ink dark:text-white">
                  {currentEmployee.name}
                </h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5">
                  {isEn ? "Online" : "متصل"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {settings.companyName || "ShiftPay HR"} (<span className="text-primary font-mono font-black">{expectedCompanyCode}</span>) • {isEn ? "Code" : "كود"}: {currentEmployee.code} • {currentEmployee.department || "عام"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReturnToAdmin && (
              <button
                type="button"
                onClick={onReturnToAdmin}
                className="hidden sm:inline-flex rounded-xl border border-line dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                {isEn ? "Admin View" : "لوحة الإدارة"}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-black text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition shadow-2xs"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{isEn ? "Sign out" : "خروج"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white dark:bg-slate-900 p-1.5 border border-line dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("slip")}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === "slip"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FileText size={15} />
            <span>{isEn ? "Payslip" : "قسيمة الراتب"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === "requests"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Send size={15} />
            <span>{isEn ? "Requests" : "طلباتي"}</span>
            {myRequests.filter((r) => r.status?.startsWith("pending")).length > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
                {myRequests.filter((r) => r.status?.startsWith("pending")).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <User size={15} />
            <span>{isEn ? "Leave & Profile" : "الأرصدة والبيانات"}</span>
          </button>
        </div>

        {/* TAB 1: PAYSLIP */}
        {activeTab === "slip" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 p-6 text-center shadow-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 px-3.5 py-1 text-xs font-black text-primary dark:text-blue-300">
                <Calendar size={13} />
                {isEn ? `Net Salary for ${monthLabel}` : `صافي راتب شهر ${monthLabel}`}
              </span>
              <div className="mt-4 text-3xl sm:text-4xl font-black text-blue-950 dark:text-blue-100">
                {formatCurrency(netSalary, currency)}
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn ? "Basic Salary" : "الراتب الأساسي"}: {formatCurrency(basicSalary, currency)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-center shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 block">{isEn ? "Basic" : "الأساسي"}</span>
                <span className="text-sm font-black text-ink dark:text-white mt-1 block">
                  {formatNumber(Math.round(basicSalary))}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 text-center shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">{isEn ? "Overtime & Bonus" : "إضافي ومكافآت"}</span>
                <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
                  +{formatNumber(Math.round(overtimeBonuses))}
                </span>
              </div>
              <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 p-3.5 text-center shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">{isEn ? "Deductions" : "الخصومات"}</span>
                <span className="text-sm font-black text-rose-800 dark:text-rose-300 mt-1 block">
                  -{formatNumber(Math.round(deductions))}
                </span>
              </div>
              <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 text-center shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">{isEn ? "Advance Loan" : "قسط السلفة"}</span>
                <span className="text-sm font-black text-amber-800 dark:text-amber-300 mt-1 block">
                  -{formatNumber(Math.round(advanceInstallment))}
                </span>
              </div>
            </div>

            {activeAdvance && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-amber-700 dark:text-amber-400" />
                    <span className="text-sm font-black text-amber-950 dark:text-amber-200">
                      {isEn ? "Active Salary Advance Loan" : "سلفة مالية نشطة بالتقسيط"}
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-200 dark:bg-amber-900/80 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    {activeAdvance.installments?.filter((i) => i.status === "deducted").length || 0} من {activeAdvance.installmentsCount} أقساط
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <div>
                    {isEn ? "Total Loan" : "إجمالي السلفة"}: <span className="font-black">{formatCurrency(activeAdvance.totalAmount, currency)}</span>
                  </div>
                  <div>
                    {isEn ? "Remaining Balance" : "الرصيد المتبقي"}: <span className="font-black">{formatCurrency(activeAdvance.remainingBalance ?? activeAdvance.totalAmount, currency)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black transition shadow-xs"
              >
                <MessageCircle size={17} />
                <span>{isEn ? "Share via WhatsApp" : "مشاركة قسيمة الراتب عبر واتساب"}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 py-3 text-xs font-black text-ink dark:text-white transition shadow-xs"
              >
                {copiedSlip ? <CheckCircle2 size={17} className="text-emerald-600" /> : <Share2 size={17} />}
                <span>{copiedSlip ? (isEn ? "Copied!" : "تم النسخ بنجاح!") : (isEn ? "Copy Salary Summary" : "نسخ ملخص الراتب")}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTS & APPROVAL PIPELINE */}
        {activeTab === "requests" && (
          <div className="space-y-5">
            {/* Submit Request Box */}
            <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-line dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-ink dark:text-white flex items-center gap-2">
                  <Send size={16} className="text-primary" />
                  <span>{isEn ? "Submit New Self-Service Request" : "تقديم طلب خدمة ذاتية جديد"}</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {isEn ? "Multi-Level Approvals" : "مسار معتمد ثنائي المراحل"}
                </span>
              </div>

              <form onSubmit={handleSubmitNewRequest} className="space-y-3.5">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType("leave")}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition border ${
                      requestType === "leave"
                        ? "border-primary bg-primary text-white"
                        : "border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isEn ? "Leave" : "طلب إجازة"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType("advance")}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition border ${
                      requestType === "advance"
                        ? "border-primary bg-primary text-white"
                        : "border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isEn ? "Advance" : "سلفة مالية"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType("permission")}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition border ${
                      requestType === "permission"
                        ? "border-primary bg-primary text-white"
                        : "border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isEn ? "Early Leave" : "إذن انصراف"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1">
                      {isEn ? "Date" : "التاريخ"}
                    </label>
                    <input
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-black text-ink dark:text-white"
                      required
                    />
                  </div>

                  {requestType === "leave" && (
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1">
                        {isEn ? "Days" : "عدد الأيام المطلوبة"} (الرصيد المتاح: {currentEmployee.vacationBalance ?? 2})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={requestDays}
                        onChange={(e) => setRequestDays(Number(e.target.value))}
                        className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-black text-ink dark:text-white"
                        required
                      />
                    </div>
                  )}

                  {requestType === "advance" && (
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1">
                        {isEn ? "Amount" : "المبلغ المطلوب"} ({currency})
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="100"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(Number(e.target.value))}
                        className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-black text-ink dark:text-white"
                        required
                      />
                    </div>
                  )}

                  {requestType === "permission" && (
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1">
                        {isEn ? "Hours" : "عدد الساعات المطلوبة"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={requestHours}
                        onChange={(e) => setRequestHours(Number(e.target.value))}
                        className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-black text-ink dark:text-white"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1">
                    {isEn ? "Reason & Notes" : "سبب الطلب وملاحظات إضافية"}
                  </label>
                  <input
                    type="text"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder={isEn ? "Explanation for your manager..." : "اكتب سبباً أو تفاصيل لاعتماد الطلب من المدير المباشر..."}
                    className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-black text-ink dark:text-white placeholder-slate-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {submitSuccess ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                      <CheckCircle2 size={16} />
                      {isEn ? "Sent to manager!" : "تم إرسال الطلب للمدير بنجاح!"}
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-primary hover:bg-blue-700 px-5 py-2.5 text-xs font-black text-white transition shadow-xs"
                  >
                    <Send size={14} />
                    <span>{isEn ? "Submit Request" : "إرسال الطلب للاعتماد"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* My Requests Tracker */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                {isEn ? "My Submitted Requests History" : "سجل طلباتي ومسار الموافقات الحالية"}
              </h4>

              {myRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line dark:border-slate-800 p-8 text-center text-slate-400">
                  <p className="text-xs font-bold">{isEn ? "No requests submitted yet." : "لم تقم بتقديم أي طلبات بعد."}</p>
                </div>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-ink dark:text-white">
                          {isEn ? req.typeLabelEn : req.typeLabelAr}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {req.date}
                        </span>
                      </div>

                      {req.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5">
                          <CheckCircle2 size={12} />
                          {isEn ? "Approved" : "معتمد نهائياً"}
                        </span>
                      ) : req.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5">
                          <AlertCircle size={12} />
                          {isEn ? "Rejected" : "مرفوض"}
                        </span>
                      ) : req.status === "pending_manager" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5">
                          <Clock size={12} />
                          {isEn ? "Pending Manager" : "بانتظار المدير المباشر"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5">
                          <ShieldCheck size={12} />
                          {isEn ? "Pending HR" : "بانتظار مدير HR"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {req.details}
                    </p>

                    {/* Step Tracker */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 flex items-center justify-between text-[11px] font-black text-slate-400">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {isEn ? "Submitted" : "مقدم"}
                      </span>
                      <span>➔</span>
                      <span className={req.status === "pending_hr" || req.status === "approved" ? "text-emerald-600" : "text-amber-600"}>
                        {isEn ? "Manager Approval" : "موافقة المدير"}
                      </span>
                      <span>➔</span>
                      <span className={req.status === "approved" ? "text-emerald-600" : "text-slate-400"}>
                        {isEn ? "HR Final Approval" : "اعتماد HR النهائي"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE BALANCE & PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  {isEn ? "Annual Leave Balance" : "رصيد الإجازات السنوية"}
                </span>
                <div className="text-3xl font-black text-ink dark:text-white">
                  {currentEmployee.vacationBalance ?? 2} {isEn ? "Days" : "يوم"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isEn ? "Available to request via portal" : "متاح للتقديم المباشر عبر البوابة"}
                </p>
              </div>

              <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  {isEn ? "Monthly Permission Balance" : "رصيد أذونات الانصراف الشهري"}
                </span>
                <div className="text-3xl font-black text-ink dark:text-white">
                  {settings.monthlyPermissionHours || 4} {isEn ? "Hours" : "ساعات"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isEn ? "Resets first day of each month" : "يتجدد أول كل شهر ميلادي"}
                </p>
              </div>
            </div>

            {/* Legal Dates */}
            <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
              <h4 className="text-xs font-black text-ink dark:text-white flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span>{isEn ? "Contract & Residency Compliance Dates" : "تواريخ العقد والإقامة"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-line dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">
                    {isEn ? "Iqama / Residency Expiry" : "تاريخ انتهاء الإقامة"}
                  </span>
                  <span className="text-ink dark:text-white font-black">
                    {currentEmployee.iqamaExpiry || "2026-10-28"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-line dark:border-slate-700">
                  <span className="text-slate-400 block mb-1">
                    {isEn ? "Contract End Date" : "تاريخ انتهاء عقد العمل"}
                  </span>
                  <span className="text-ink dark:text-white font-black">
                    {currentEmployee.contractEnd || "2026-10-30"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
