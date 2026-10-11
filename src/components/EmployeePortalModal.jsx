import React, { useState } from "react";
import {
  X,
  User,
  Building2,
  Calendar,
  CreditCard,
  MessageCircle,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  FileText,
  Send,
  Check,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  LogIn
} from "lucide-react";
import { formatCurrency, formatNumber } from "../lib/payroll";
import { generateWhatsAppSlipMessage, openWhatsAppSlip } from "../lib/exporters";

export default function EmployeePortalModal({
  isOpen,
  onClose,
  employee,
  payrollRow,
  advances = [],
  monthLabel = "",
  settings = {},
  requests = [],
  onSubmitRequest,
  onApproveRequest,
  onRejectRequest,
  allEmployees = [],
  onSelectEmployee,
  currentRole = "super_admin",
  lang = "ar"
}) {
  const [activeTab, setActiveTab] = useState("slip"); // "slip" | "requests" | "profile"
  const [copied, setCopied] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [requestType, setRequestType] = useState("leave"); // "leave" | "advance" | "permission"
  const [requestDays, setRequestDays] = useState(1);
  const [requestHours, setRequestHours] = useState(2);
  const [requestAmount, setRequestAmount] = useState(1500);
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestReason, setRequestReason] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isEn = lang === "en";

  if (!isOpen) return null;

  const currentEmp = employee || (payrollRow ? {
    id: payrollRow.employeeId || payrollRow.employeeCode,
    code: payrollRow.employeeCode,
    name: payrollRow.employeeName,
    department: payrollRow.department,
    salary: payrollRow.salary,
    vacationBalance: payrollRow.vacationBalance ?? 21,
    iqamaExpiry: payrollRow.iqamaExpiry || "2027-01-01",
    contractEnd: payrollRow.contractEnd || "2027-01-01",
    jobTitle: payrollRow.jobTitle || "موظف"
  } : null);

  const empName = payrollRow?.employeeName || currentEmp?.name || (isEn ? "Employee" : "الموظف");
  const empCode = payrollRow?.employeeCode || currentEmp?.code || "";
  const empDept = payrollRow?.department || currentEmp?.department || (isEn ? "General" : "عام");
  const empTitle = currentEmp?.jobTitle || (isEn ? "Staff Specialist" : "أخصائي");
  const vacationBalance = currentEmp?.vacationBalance ?? 2;
  const currency = settings.currency || (isEn ? "EGP" : "جنيه");
  const netSalary = payrollRow?.netSalary || currentEmp?.salary || 0;
  const basicSalary = payrollRow?.salary || currentEmp?.salary || 0;
  const overtimeBonuses = payrollRow?.overtimeBonuses || 0;
  const deductions = payrollRow?.deductions || 0;
  const advanceInstallment = payrollRow?.advanceInstallment || 0;
  const advanceInstallmentLabel = payrollRow?.advanceInstallmentLabel || "";

  // Active advance for this employee
  const activeAdvance = (advances || []).find(
    (adv) => (adv.employeeCode === empCode || adv.employeeId === currentEmp?.id) && adv.status === "active"
  );

  // Filter requests for this employee
  const employeeRequests = (requests || []).filter(
    (req) => req.employeeCode === empCode || req.employeeId === currentEmp?.id
  );

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppSlipMessage({
      row: payrollRow || {
        employeeName: empName,
        employeeCode: empCode,
        department: empDept,
        salary: basicSalary,
        overtimeBonuses,
        bonuses: 0,
        deductions,
        advanceInstallment,
        advanceInstallmentLabel,
        netSalary
      },
      monthLabel,
      currency,
      companyName: settings.companyName || "ShiftPay HR"
    });
    openWhatsAppSlip({ phone: currentEmp?.phone, message });
  };

  const handleCopyText = () => {
    const message = generateWhatsAppSlipMessage({
      row: payrollRow || {
        employeeName: empName,
        employeeCode: empCode,
        department: empDept,
        salary: basicSalary,
        overtimeBonuses,
        bonuses: 0,
        deductions,
        advanceInstallment,
        advanceInstallmentLabel,
        netSalary
      },
      monthLabel,
      currency,
      companyName: settings.companyName || "ShiftPay HR"
    });
    navigator.clipboard?.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitNewRequest = (e) => {
    e.preventDefault();
    if (!onSubmitRequest) return;

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
      employeeCode: empCode,
      employeeName: empName,
      employeeId: currentEmp?.id,
      department: empDept,
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
          by: empName,
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

  const handleSwitchLogin = (e) => {
    e.preventDefault();
    const found = allEmployees.find(
      (emp) => emp.code.toLowerCase() === loginCode.trim().toLowerCase() ||
               (emp.email && emp.email.toLowerCase() === loginCode.trim().toLowerCase())
    );
    if (found && onSelectEmployee) {
      onSelectEmployee(found);
      setLoginCode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-line dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white font-black text-lg shadow-xs">
              {empName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-ink dark:text-white">{empName}</h2>
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-primary dark:text-blue-300 text-[10px] font-extrabold px-2 py-0.5">
                  ESS Portal
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn ? "Code" : "كود"}: {empCode} • {empDept} • {empTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation & Switcher */}
        <div className="flex items-center justify-between border-b border-line dark:border-slate-800 px-5 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("slip")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-black transition ${
                activeTab === "slip"
                  ? "border-primary text-primary dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <FileText size={15} />
              <span>{isEn ? "Payslip" : "قسيمة الراتب"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`relative flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-black transition ${
                activeTab === "requests"
                  ? "border-primary text-primary dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <Send size={15} />
              <span>{isEn ? "Requests & Approvals" : "الطلبات والموافقات"}</span>
              {employeeRequests.filter((r) => r.status.startsWith("pending")).length > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
                  {employeeRequests.filter((r) => r.status.startsWith("pending")).length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-black transition ${
                activeTab === "profile"
                  ? "border-primary text-primary dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <User size={15} />
              <span>{isEn ? "Leave & Profile" : "الإجازات والبيانات"}</span>
            </button>
          </div>

          {/* Quick PWA Login Switcher */}
          {allEmployees.length > 1 && (
            <form onSubmit={handleSwitchLogin} className="hidden sm:flex items-center gap-1.5 py-2">
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder={isEn ? "Switch (Code: E002)" : "تبديل (كود: E002)"}
                className="w-32 rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-ink dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-200 dark:bg-slate-700 px-2 py-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition"
              >
                <LogIn size={12} />
              </button>
            </form>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: PAYSLIP */}
          {activeTab === "slip" && (
            <>
              {/* Net Salary Highlight Card */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 p-5 text-center shadow-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 px-3 py-0.5 text-xs font-bold text-primary dark:text-blue-300">
                  <Calendar size={13} />
                  {isEn ? `Net Salary for ${monthLabel}` : `صافي راتب شهر ${monthLabel}`}
                </span>
                <div className="mt-3 text-3xl font-black text-blue-950 dark:text-blue-100">
                  {formatCurrency(netSalary, currency)}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isEn ? "Basic Salary" : "الراتب الأساسي"}: {formatCurrency(basicSalary, currency)}
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {isEn ? "Basic" : "الأساسي"}
                  </span>
                  <span className="text-sm font-black text-ink dark:text-white mt-1 block">
                    {formatNumber(Math.round(basicSalary))}
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                    {isEn ? "Overtime & Bonus" : "إضافي ومكافآت"}
                  </span>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
                    +{formatNumber(Math.round(overtimeBonuses))}
                  </span>
                </div>
                <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 p-3 text-center">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">
                    {isEn ? "Deductions" : "الخصومات"}
                  </span>
                  <span className="text-sm font-black text-rose-800 dark:text-rose-300 mt-1 block">
                    -{formatNumber(Math.round(deductions))}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-center">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                    {isEn ? "Advance Deduction" : "قسط السلفة"}
                  </span>
                  <span className="text-sm font-black text-amber-800 dark:text-amber-300 mt-1 block">
                    -{formatNumber(Math.round(advanceInstallment))}
                  </span>
                </div>
              </div>

              {/* Active Advance Module Status */}
              {activeAdvance && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-amber-700 dark:text-amber-400" />
                      <span className="text-sm font-black text-amber-950 dark:text-amber-200">
                        {isEn ? "Active Installment Loan" : "سلفة نشطة بالتقسيط"}
                      </span>
                    </div>
                    <span className="rounded-full bg-amber-200 dark:bg-amber-900/80 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      {activeAdvance.installments?.filter((i) => i.status === "deducted").length || 0} من {activeAdvance.installmentsCount} أقساط
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <div>
                      {isEn ? "Total Amount" : "المبلغ الإجمالي"}: <span className="font-black">{formatCurrency(activeAdvance.totalAmount, currency)}</span>
                    </div>
                    <div>
                      {isEn ? "Remaining Balance" : "الرصيد المتبقي"}: <span className="font-black">{formatCurrency(activeAdvance.remainingBalance ?? activeAdvance.totalAmount, currency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <MessageCircle size={18} />
                  <span>{isEn ? "Share via WhatsApp" : "مشاركة القسيمة عبر واتساب"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
                >
                  {copied ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Share2 size={18} />}
                  <span>{copied ? (isEn ? "Copied to clipboard!" : "تم نسخ نص القسيمة!") : (isEn ? "Copy Salary Summary" : "نسخ ملخص الراتب")}</span>
                </button>
              </div>
            </>
          )}

          {/* TAB 2: REQUESTS & MULTI-LEVEL APPROVALS */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* Submit New Request Box */}
              <div className="rounded-2xl border border-line dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-ink dark:text-white flex items-center gap-2">
                    <Send size={16} className="text-primary dark:text-blue-400" />
                    <span>{isEn ? "Submit New Self-Service Request" : "تقديم طلب خدمة ذاتية جديد"}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    {isEn ? "Multi-Level Workflow" : "مسار موافقات ثنائي المستويات"}
                  </span>
                </div>

                <form onSubmit={handleSubmitNewRequest} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRequestType("leave")}
                      className={`p-2.5 rounded-xl border text-center font-black text-xs transition ${
                        requestType === "leave"
                          ? "border-primary bg-primary text-white"
                          : "border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isEn ? "Leave Request" : "طلب إجازة"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType("advance")}
                      className={`p-2.5 rounded-xl border text-center font-black text-xs transition ${
                        requestType === "advance"
                          ? "border-primary bg-primary text-white"
                          : "border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isEn ? "Salary Advance" : "سلفة مالية"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType("permission")}
                      className={`p-2.5 rounded-xl border text-center font-black text-xs transition ${
                        requestType === "permission"
                          ? "border-primary bg-primary text-white"
                          : "border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isEn ? "Early Leave" : "إذن انصراف"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                        {isEn ? "Date" : "التاريخ"}
                      </label>
                      <input
                        type="date"
                        value={requestDate}
                        onChange={(e) => setRequestDate(e.target.value)}
                        className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100"
                        required
                      />
                    </div>

                    {requestType === "leave" && (
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                          {isEn ? "Number of Days" : "عدد الأيام المطلوبة"} (الرصيد: {vacationBalance})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={requestDays}
                          onChange={(e) => setRequestDays(Number(e.target.value))}
                          className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100"
                          required
                        />
                      </div>
                    )}

                    {requestType === "advance" && (
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                          {isEn ? "Amount" : "المبلغ المطلوب"} ({currency})
                        </label>
                        <input
                          type="number"
                          step="100"
                          min="100"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(Number(e.target.value))}
                          className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100"
                          required
                        />
                      </div>
                    )}

                    {requestType === "permission" && (
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                          {isEn ? "Hours" : "عدد ساعات الإذن"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={requestHours}
                          onChange={(e) => setRequestHours(Number(e.target.value))}
                          className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                      {isEn ? "Reason & Notes" : "سبب الطلب وملاحظات إضافية"}
                    </label>
                    <input
                      type="text"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder={isEn ? "Provide context for manager approval..." : "اكتب سبباً أو تفاصيل لاعتماد الطلب من المدير المباشر..."}
                      className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100 placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {submitSuccess ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        {isEn ? "Request submitted to Direct Manager!" : "تم تقديم الطلب وإرساله للمدير المباشر!"}
                      </span>
                    ) : <span />}

                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-xs"
                    >
                      <Send size={14} />
                      <span>{isEn ? "Submit Request" : "إرسال الطلب للاعتماد"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Requests History & Multi-Level Tracking */}
              <div>
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  {isEn ? "My Submitted Requests & Approval Pipeline" : "سجل الطلبات ومسار الموافقات الحالية"}
                </h4>

                {employeeRequests.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-line dark:border-slate-800 text-slate-400">
                    <p className="text-xs font-bold">
                      {isEn ? "No requests submitted yet." : "لم يتم تقديم أي طلبات حتى الآن."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeeRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3"
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

                          {/* Status Pill */}
                          {req.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black">
                              <CheckCircle2 size={12} />
                              {isEn ? "Fully Approved" : "معتمد نهائياً"}
                            </span>
                          ) : req.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-black">
                              <AlertCircle size={12} />
                              {isEn ? "Rejected" : "مرفوض"}
                            </span>
                          ) : req.status === "pending_manager" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-black">
                              <Clock size={12} />
                              {isEn ? "Stage 1: Pending Direct Manager" : "المرحلة 1: بانتظار المدير المباشر"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-black">
                              <ShieldCheck size={12} />
                              {isEn ? "Stage 2: Pending HR Director" : "المرحلة 2: بانتظار مدير HR"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {req.details}
                        </p>

                        {/* Visual Workflow Steps (Multi-Level Approval Pipeline) */}
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                          {/* Step 1: Employee */}
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} />
                            <span>{isEn ? "Submitted" : "تقديم الموظف"}</span>
                          </div>

                          <span className="text-slate-300 dark:text-slate-600">➔</span>

                          {/* Step 2: Direct Manager */}
                          <div className={`flex items-center gap-1.5 ${
                            req.status === "pending_hr" || req.status === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : req.status === "pending_manager"
                              ? "text-amber-600 dark:text-amber-400 font-black animate-pulse"
                              : "text-slate-400"
                          }`}>
                            {req.status === "pending_hr" || req.status === "approved" ? <CheckCircle2 size={13} /> : <UserCheck size={13} />}
                            <span>{isEn ? "Manager" : "المدير المباشر"}</span>
                          </div>

                          <span className="text-slate-300 dark:text-slate-600">➔</span>

                          {/* Step 3: HR Director */}
                          <div className={`flex items-center gap-1.5 ${
                            req.status === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : req.status === "pending_hr"
                              ? "text-blue-600 dark:text-blue-400 font-black animate-pulse"
                              : "text-slate-400"
                          }`}>
                            {req.status === "approved" ? <CheckCircle2 size={13} /> : <ShieldCheck size={13} />}
                            <span>{isEn ? "HR Director" : "مدير HR"}</span>
                          </div>
                        </div>

                        {/* Manager / HR Quick Approval Actions */}
                        {(currentRole === "super_admin" || currentRole === "hr_director" || currentRole === "dept_manager") &&
                          req.status.startsWith("pending") && (
                            <div className="pt-2 border-t border-line dark:border-slate-800 flex items-center justify-end gap-2">
                              <span className="text-[10px] font-bold text-slate-400 mr-auto">
                                {isEn ? `Action as (${currentRole})` : `إجراء كـ (${currentRole})`}:
                              </span>
                              <button
                                type="button"
                                onClick={() => onRejectRequest && onRejectRequest(req.id)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              >
                                {isEn ? "Reject" : "رفض"}
                              </button>
                              <button
                                type="button"
                                onClick={() => onApproveRequest && onApproveRequest(req.id, currentRole)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition shadow-2xs"
                              >
                                {req.status === "pending_manager"
                                  ? (isEn ? "Approve (Stage 1)" : "موافقة المدير (مرحلة 1)")
                                  : (isEn ? "Final HR Approval" : "اعتماد نهائي (HR)")}
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE BALANCE & PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    {isEn ? "Annual Leave Balance" : "رصيد الإجازات السنوية"}
                  </span>
                  <div className="mt-2 text-2xl font-black text-ink dark:text-white">
                    {vacationBalance} {isEn ? "Days" : "يوم"}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {vacationBalance <= 0
                      ? (isEn ? "Balance exhausted" : "الرصيد مستنفذ بالكامل")
                      : (isEn ? "Available for requests" : "متاح للتقديم عبر البوابة")}
                  </p>
                </div>

                <div className="rounded-xl border border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    {isEn ? "Monthly Permission Balance" : "رصيد أذونات الانصراف الشهري"}
                  </span>
                  <div className="mt-2 text-2xl font-black text-ink dark:text-white">
                    {settings.monthlyPermissionHours || 4} {isEn ? "Hours" : "ساعات"}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isEn ? "Resets first of each month" : "يتجدد أول كل شهر ميلادي"}
                  </p>
                </div>
              </div>

              {/* Legal & Expiry Dates */}
              <div className="rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <h4 className="text-xs font-black text-ink dark:text-white flex items-center gap-2">
                  <Calendar size={15} className="text-primary dark:text-blue-400" />
                  <span>{isEn ? "Contract & Residency Compliance Dates" : "تواريخ العقد والإقامة والامتثال"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-line dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">
                      {isEn ? "Residency / Iqama Expiry" : "تاريخ انتهاء الإقامة"}
                    </span>
                    <span className="font-black text-ink dark:text-white">
                      {currentEmp?.iqamaExpiry || "2026-10-28"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-line dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">
                      {isEn ? "Contract End Date" : "تاريخ انتهاء عقد العمل"}
                    </span>
                    <span className="font-black text-ink dark:text-white">
                      {currentEmp?.contractEnd || "2026-10-30"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>ShiftPay HR • Enterprise ESS Portal (PWA)</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary dark:text-blue-400 hover:underline font-extrabold"
          >
            {isEn ? "Close" : "إغلاق"}
          </button>
        </div>
      </div>
    </div>
  );
}
