import React, { useState } from "react";
import {
  X,
  Shield,
  Search,
  Download,
  Filter,
  Clock,
  User,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

export default function AuditTrailModal({
  isOpen,
  onClose,
  auditLogs = [],
  lang = "ar"
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("all");
  const isEn = lang === "en";

  if (!isOpen) return null;

  const actions = [
    { id: "all", labelAr: "جميع العمليات", labelEn: "All Actions" },
    { id: "salary", labelAr: "تعديل رواتب", labelEn: "Salary Changes" },
    { id: "payroll", labelAr: "اعتماد مسير رواتب", labelEn: "Payroll Approval" },
    { id: "wps", labelAr: "تصدير WPS / بنوك", labelEn: "WPS / Bank Export" },
    { id: "attendance", labelAr: "حركات البصمة", labelEn: "Biometric Logs" },
    { id: "request", labelAr: "طلبات الموظفين", labelEn: "Employee Requests" },
    { id: "settings", labelAr: "تعديل السياسات", labelEn: "Settings & Compliance" }
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      (log.user || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip || "").includes(searchTerm);

    if (!matchesSearch) return false;
    if (selectedActionFilter === "all") return true;
    if (selectedActionFilter === "salary") return (log.action || "").includes("راتب") || (log.action || "").toLowerCase().includes("salary");
    if (selectedActionFilter === "payroll") return (log.action || "").includes("مسير") || (log.action || "").toLowerCase().includes("payroll");
    if (selectedActionFilter === "wps") return (log.action || "").includes("WPS") || (log.action || "").includes("بنوك");
    if (selectedActionFilter === "attendance") return (log.action || "").includes("بصمة") || (log.action || "").toLowerCase().includes("attendance");
    if (selectedActionFilter === "request") return (log.action || "").includes("طلب") || (log.action || "").toLowerCase().includes("request");
    if (selectedActionFilter === "settings") return (log.action || "").includes("إعدادات") || (log.action || "").toLowerCase().includes("settings");
    return true;
  });

  const handleExportCsv = () => {
    const headers = isEn
      ? ["ID", "Timestamp", "User", "Action", "Details", "IP Address", "Status"]
      : ["المعرف", "التوقيت", "المستخدم", "العملية", "التفاصيل", "عنوان IP", "الحالة"];
    
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.user,
      l.action,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ip,
      l.status
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ShiftPay-Audit-Trail-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Shield size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink dark:text-white">
                {isEn ? "Enterprise Security Audit Trail" : "سجل التتبع الأمني والحوكمة (Audit Trail)"}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn
                  ? "Tamper-evident logs of all payroll, attendance, and administrative events"
                  : "سجل توثيقي غير قابل للتلاعب لجميع تعديلات الرواتب، الصلاحيات، وشهادات الامتثال"}
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

        {/* Filters & Export Bar */}
        <div className="p-4 border-b border-line dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isEn ? "Search by user, action, IP, or details..." : "بحث بالمستخدم، العملية، عنوان IP، أو التفاصيل..."}
                className="w-full rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-9 py-2 text-xs font-bold text-ink dark:text-slate-100 placeholder-slate-400 focus:border-primary focus:outline-hidden"
              />
            </div>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="rounded-xl border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-ink dark:text-slate-100 focus:border-primary focus:outline-hidden"
            >
              {actions.map((act) => (
                <option key={act.id} value={act.id}>
                  {isEn ? act.labelEn : act.labelAr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-black text-slate-700 dark:text-slate-200 transition"
          >
            <Download size={14} />
            <span>{isEn ? "Export CSV" : "تصدير السجل (CSV)"}</span>
          </button>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Shield size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">{isEn ? "No audit logs found matching criteria." : "لا توجد سجلات مطابقة للبحث المحدد."}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-line dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-ink dark:text-white">
                        {log.action}
                      </span>
                      <span className="rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[10px] font-extrabold">
                        {log.user}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <Globe size={11} />
                        IP: {log.ip || "197.34.120.45"}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {log.details}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock size={12} />
                      {log.timestamp}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black">
                      <CheckCircle2 size={11} />
                      {isEn ? "Verified" : "موثق"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>
            {isEn ? `Showing ${filteredLogs.length} events` : `إجمالي الأحداث المسجلة: ${filteredLogs.length}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-black"
          >
            {isEn ? "Close" : "إغلاق"}
          </button>
        </div>
      </div>
    </div>
  );
}
