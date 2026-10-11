import React, { useState, useMemo } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  CreditCard,
  FileText,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import { formatCurrency, formatNumber } from "../lib/payroll";

export default function RequestsView({
  requests = [],
  employees = [],
  departments = [],
  settings = {},
  currentRole = "super_admin",
  onApproveRequest,
  onRejectRequest,
  lang = "ar"
}) {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved" | "rejected" | "all"
  const [selectedType, setSelectedType] = useState("all"); // "all" | "leave" | "advance" | "permission"
  const [selectedDept, setSelectedDept] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectModal, setRejectModal] = useState({ isOpen: false, reqId: null, reason: "" });

  const isEn = lang === "en";
  const currency = settings.currency || (isEn ? "EGP" : "جنيه");

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (activeTab === "pending" && !req.status?.startsWith("pending")) return false;
      if (activeTab === "approved" && req.status !== "approved") return false;
      if (activeTab === "rejected" && req.status !== "rejected") return false;

      // Type filter
      if (selectedType !== "all" && req.type !== selectedType) return false;

      // Department filter
      if (selectedDept !== "all" && req.department !== selectedDept) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (req.employeeName || "").toLowerCase().includes(term);
        const matchesCode = (req.employeeCode || "").toLowerCase().includes(term);
        const matchesDetails = (req.details || "").toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesDetails) return false;
      }

      return true;
    });
  }, [requests, activeTab, selectedType, selectedDept, searchTerm]);

  const pendingCount = requests.filter((r) => r.status?.startsWith("pending")).length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const handleConfirmReject = () => {
    if (rejectModal.reqId && onRejectRequest) {
      onRejectRequest(rejectModal.reqId, rejectModal.reason);
      setRejectModal({ isOpen: false, reqId: null, reason: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-primary dark:text-blue-400 border border-blue-100 dark:border-slate-700 shadow-2xs">
              <Send size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black text-ink dark:text-white">
                {isEn ? "Requests & Approvals Inbox" : "صندوق الطلبات والاعتمادات"}
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn
                  ? "Review and approve employee leaves, salary advances, and early departure permissions with multi-level workflow"
                  : "مراجعة واعتماد طلبات الإجازات، السلف المالية، وأذونات الانصراف مع خصم الأرصدة آلياً فور الموافقة"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-black text-amber-800 dark:text-amber-300 shadow-2xs">
            <Clock size={14} />
            <span>{isEn ? "Pending" : "بانتظار الاعتماد"}: {pendingCount}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <CheckCircle2 size={14} />
            <span>{isEn ? "Approved" : "معتمد"}: {approvedCount}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>{isEn ? "Pending Approval" : "بانتظار الاعتماد"}</span>
            {pendingCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "pending" ? "bg-white text-primary" : "bg-amber-500 text-white"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "approved"
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {isEn ? "Approved Requests" : "الطلبات المعتمدة"} ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "rejected"
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {isEn ? "Rejected" : "المرفوضة"} ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {isEn ? "All History" : "كافة السجلات"} ({requests.length})
          </button>
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isEn ? "Search employee name, code, or details..." : "بحث باسم الموظف، الكود، أو التفاصيل..."}
              className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-9 py-2 text-xs font-bold text-ink dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100 focus:outline-hidden focus:border-primary"
          >
            <option value="all">{isEn ? "All Request Types" : "جميع أنواع الطلبات"}</option>
            <option value="leave">{isEn ? "Annual Leaves" : "إجازات سنوية / اعتيادية"}</option>
            <option value="advance">{isEn ? "Salary Advances" : "سلف مالية"}</option>
            <option value="permission">{isEn ? "Early Departures" : "أذونات انصراف مبكر"}</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100 focus:outline-hidden focus:border-primary"
          >
            <option value="all">{isEn ? "All Departments" : "جميع الأقسام"}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Cards List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400">
          <Send size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-black text-ink dark:text-white">
            {isEn ? "No requests found matching criteria" : "لا توجد طلبات مطابقة للبحث الحالي"}
          </h3>
          <p className="mt-1 text-xs font-bold">
            {isEn ? "Submitted self-service requests will appear here for review." : "ستظهر هنا كافة طلبات الخدمة الذاتية المقدمة من الموظفين للاعتماد."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const emp = employees.find((e) => e.code === req.employeeCode || e.id === req.employeeId);
            const isPendingManager = req.status === "pending_manager";
            const isPendingHr = req.status === "pending_hr";
            const isPending = req.status?.startsWith("pending");

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-primary/40 space-y-4"
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-primary dark:text-blue-400 font-black text-sm border border-blue-100 dark:border-slate-700">
                      {req.employeeName?.[0] || "E"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-ink dark:text-white">
                          {req.employeeName}
                        </span>
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {req.employeeCode}
                        </span>
                        <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 text-primary dark:text-blue-300 px-2 py-0.5 text-[11px] font-extrabold">
                          {req.department}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 font-bold">
                        {isEn ? "Submitted at" : "تاريخ التقديم"}: {req.createdAt || req.date}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start sm:self-auto">
                    {req.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-3 py-1 text-xs font-black">
                        <CheckCircle2 size={14} />
                        {isEn ? "Fully Approved" : "معتمد نهائياً ومُنفذ"}
                      </span>
                    ) : req.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 px-3 py-1 text-xs font-black">
                        <AlertCircle size={14} />
                        {isEn ? "Rejected" : "طلب مرفوض"}
                      </span>
                    ) : isPendingManager ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-black">
                        <Clock size={14} />
                        {isEn ? "Stage 1: Pending Direct Manager" : "المرحلة 1: بانتظار المدير المباشر"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-3 py-1 text-xs font-black">
                        <ShieldCheck size={14} />
                        {isEn ? "Stage 2: Pending HR Director" : "المرحلة 2: بانتظار مدير الموارد البشرية"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Request Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-line dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      {isEn ? "Request Type" : "نوع الطلب"}
                    </span>
                    <span className="text-xs font-black text-ink dark:text-white flex items-center gap-1.5">
                      {req.type === "leave" && <Calendar size={14} className="text-primary" />}
                      {req.type === "advance" && <CreditCard size={14} className="text-amber-600" />}
                      {req.type === "permission" && <Clock size={14} className="text-blue-600" />}
                      <span>{isEn ? req.typeLabelEn : req.typeLabelAr}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-line dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      {isEn ? "Target Date / Scope" : "التاريخ / المدة"}
                    </span>
                    <span className="text-xs font-black text-ink dark:text-white">
                      {req.days ? `${req.days} ${isEn ? "days" : "أيام"} (ابتداءً من ${req.date})` : null}
                      {req.amount ? `${formatCurrency(req.amount, currency)} (${req.installments || 1} أقساط)` : null}
                      {req.hours ? `${req.hours} ${isEn ? "hours" : "ساعات"} (${req.date})` : null}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-line dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      {isEn ? "Employee Balances Context" : "رصيد الموظف الحالي"}
                    </span>
                    <span className="text-xs font-black text-ink dark:text-white">
                      {isEn ? "Leave Balance" : "رصيد الإجازات"}: {emp?.vacationBalance ?? 2} {isEn ? "days" : "يوم"}
                    </span>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="rounded-xl bg-blue-50/50 dark:bg-slate-800/30 p-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="font-black text-ink dark:text-white mr-1.5">
                    {isEn ? "Details & Reason" : "التفاصيل والسبب"}:
                  </span>
                  <span>{req.details}</span>
                </div>

                {/* Workflow Tracker (Audit Trail of Request) */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-500 text-[11px]">
                      {isEn ? "Approval Pipeline" : "مسار الاعتماد"}:
                    </span>
                    <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} />
                      {isEn ? "Submitted" : "تقديم الموظف"}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">➔</span>
                    <span className={`inline-flex items-center gap-1 font-black ${
                      req.status === "pending_hr" || req.status === "approved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isPendingManager
                        ? "text-amber-600 dark:text-amber-400 animate-pulse"
                        : "text-slate-400"
                    }`}>
                      {req.status === "pending_hr" || req.status === "approved" ? <CheckCircle2 size={13} /> : <UserCheck size={13} />}
                      {isEn ? "Stage 1: Direct Manager" : "مرحلة 1: المدير المباشر"}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">➔</span>
                    <span className={`inline-flex items-center gap-1 font-black ${
                      req.status === "approved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isPendingHr
                        ? "text-blue-600 dark:text-blue-400 animate-pulse"
                        : "text-slate-400"
                    }`}>
                      {req.status === "approved" ? <CheckCircle2 size={13} /> : <ShieldCheck size={13} />}
                      {isEn ? "Stage 2: HR Director" : "مرحلة 2: مدير الموارد البشرية"}
                    </span>
                  </div>

                  {/* Actions for Manager / HR */}
                  {isPending && (
                    <div className="flex items-center gap-2 mr-auto rtl:mr-auto ltr:ml-auto">
                      <button
                        type="button"
                        onClick={() => setRejectModal({ isOpen: true, reqId: req.id, reason: "" })}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition shadow-2xs"
                      >
                        <X size={14} />
                        <span>{isEn ? "Reject" : "رفض الطلب"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveRequest && onApproveRequest(req.id, currentRole)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-black text-white transition shadow-xs"
                      >
                        <Check size={14} />
                        <span>
                          {isPendingManager
                            ? (isEn ? "Approve (Stage 1)" : "موافقة المدير المباشر")
                            : (isEn ? "Final HR Approval & Execute" : "اعتماد وتنفيذ نهائي (HR)")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal with Note */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-ink dark:text-white flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600" />
              <span>{isEn ? "Reject Request Confirmation" : "تأكيد رفض طلب الموظف"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? "Please provide an optional reason or explanation for rejecting this request:"
                : "يرجى كتابة سبب أو ملاحظة الرفض لتوضيحها للموظف في حسابه:"}
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3}
              placeholder={isEn ? "Reason for rejection..." : "مثال: تعارض مع خطة عمل القسم / استنفاذ رصيد السلف..."}
              className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-bold text-ink dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, reqId: null, reason: "" })}
                className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {isEn ? "Cancel" : "إلغاء"}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 shadow-xs"
              >
                {isEn ? "Confirm Rejection" : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
