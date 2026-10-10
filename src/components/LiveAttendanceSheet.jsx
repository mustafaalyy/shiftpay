import React, { useState, useMemo } from "react";
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  Users,
  Building2,
  Sparkles,
  ArrowUpDown,
  Laptop,
  Check,
  X
} from "lucide-react";
import { formatNumber, parseTimeToMinutes, minutesToTime } from "../lib/payroll";

export default function LiveAttendanceSheet({
  attendanceLogs = [],
  employees = [],
  departments = [],
  shifts = [],
  settings = {},
  devices = [],
  onRecordPunch,
  onApplyToPayroll,
  setNotice,
  setToastMessage
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [dateFilter, setDateFilter] = useState("today"); // "today" | "month" | "all" | custom date
  const [customDate, setCustomDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeCode: "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    type: "punch",
    note: ""
  });

  // Department map
  const deptMap = useMemo(() => {
    return new Map(departments.map((d) => [d.id, d.name]));
  }, [departments]);

  // Employee map
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [String(e.code).trim(), e]));
  }, [employees]);

  // Shift map
  const shiftMap = useMemo(() => {
    return new Map(shifts.map((s) => [s.id, s]));
  }, [shifts]);

  // Filter attendance logs
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      // Date filter
      if (dateFilter === "today" && log.date !== todayStr) return false;
      if (dateFilter === "month" && !log.date.startsWith(currentMonthStr)) return false;
      if (dateFilter === "custom" && customDate && log.date !== customDate) return false;

      // Employee search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatches = String(log.employeeCode || "").toLowerCase().includes(q);
        const nameMatches = String(log.name || "").toLowerCase().includes(q);
        if (!codeMatches && !nameMatches) return false;
      }

      // Department filter
      const emp = employeeMap.get(String(log.employeeCode).trim());
      if (selectedDeptId && emp?.departmentId !== selectedDeptId) {
        return false;
      }

      return true;
    });
  }, [attendanceLogs, dateFilter, todayStr, currentMonthStr, customDate, searchQuery, selectedDeptId, employeeMap]);

  // Compute status for a log
  const computeLogStatus = (log) => {
    const emp = employeeMap.get(String(log.employeeCode).trim());
    const shift = emp?.shiftId ? shiftMap.get(emp.shiftId) : shifts[0];
    const shiftStart = shift ? parseTimeToMinutes(shift.startTime) : 9 * 60;
    const grace = shift ? Number(shift.gracePeriod || 0) : 15;

    const hasIn = Boolean(log.checkIn);
    const hasOut = Boolean(log.checkOut);

    if (hasIn && hasOut) {
      const inMinutes = parseTimeToMinutes(log.checkIn);
      const isLate = inMinutes > shiftStart + grace;
      if (isLate) {
        const lateMin = inMinutes - shiftStart;
        return { label: `متأخر (${lateMin} دقيقة)`, tone: "amber", isLate: true, lateMinutes: lateMin };
      }
      return { label: "حاضر في الموعد", tone: "emerald", isLate: false };
    }

    if (hasIn && !hasOut) {
      return { label: "سجل حضور (بدون انصراف)", tone: "blue", incomplete: true };
    }

    if (!hasIn && hasOut) {
      return { label: "سجل انصراف فقط", tone: "rose", incomplete: true };
    }

    return { label: "حاضر", tone: "slate" };
  };

  // Metrics for today's logs
  const todayLogs = useMemo(() => {
    return attendanceLogs.filter((log) => log.date === todayStr);
  }, [attendanceLogs, todayStr]);

  const metrics = useMemo(() => {
    let onTimeCount = 0;
    let lateCount = 0;
    let singlePunchCount = 0;

    todayLogs.forEach((log) => {
      const st = computeLogStatus(log);
      if (st.isLate) lateCount++;
      else if (st.incomplete) singlePunchCount++;
      else onTimeCount++;
    });

    return {
      totalToday: todayLogs.length,
      onTime: onTimeCount,
      late: lateCount,
      singlePunch: singlePunchCount
    };
  }, [todayLogs]);

  // Export to Excel
  const handleExportExcel = async () => {
    if (filteredLogs.length === 0) {
      if (setNotice) setNotice("لا توجد بيانات حضور لتصديرها.");
      return;
    }

    const XLSX = await import("xlsx");
    const data = filteredLogs.map((log) => {
      const emp = employeeMap.get(String(log.employeeCode).trim());
      const st = computeLogStatus(log);
      const dept = emp?.departmentId ? deptMap.get(emp.departmentId) : "عام";
      return {
        "كود الموظف": log.employeeCode,
        "اسم الموظف": log.name || emp?.name || "",
        "القسم": dept,
        "التاريخ": log.date,
        "وقت الحضور": log.checkIn || "-",
        "وقت الانصراف": log.checkOut || "-",
        "جميع الحركات": Array.isArray(log.punches) ? log.punches.join(" | ") : "",
        "الحالة": st.label
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "سجل الحضور الحي");
    XLSX.writeFile(workbook, `ShiftPay_Live_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`);

    if (setToastMessage) {
      setToastMessage({ message: "تم تصدير ملف إكسل لسجل الحضور الحي بنجاح.", type: "success" });
    }
  };

  // Submit manual punch
  const handleManualPunchSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.employeeCode || !manualForm.date || !manualForm.time) return;

    if (onRecordPunch) {
      onRecordPunch({
        employeeCode: manualForm.employeeCode,
        date: manualForm.date,
        time: manualForm.time,
        deviceSn: "MANUAL_ENTRY",
        employeeName: employeeMap.get(String(manualForm.employeeCode).trim())?.name
      });
    }

    setIsManualModalOpen(false);
    setManualForm({
      employeeCode: "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      type: "punch",
      note: ""
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50 to-white p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
              مزامنة حية ومباشرة (Live Realtime Sheet)
            </span>
            <span className="text-xs text-slate-500">
              {devices.length > 0 ? `متصل بـ ${devices.length} جهاز بصمة` : "جاهز لاستقبال البصمات"}
            </span>
          </div>
          <h2 className="text-xl font-black text-blue-950">
            سجل البصمات والحركات اليومية
          </h2>
          <p className="text-xs text-slate-600">
            كل بصمة يسجلها الموظف على الماكينة أو عبر وسيط الربط تظهر هنا في اللحظة والثانية مع احتساب وقت الحضور والانصراف والتأخير.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-extrabold text-white shadow hover:opacity-90 transition active:scale-95"
          >
            <Plus size={15} />
            <span>تسجيل بصمة يدوية</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-sm hover:border-primary hover:text-primary transition"
          >
            <Download size={15} />
            <span>تصدير Excel</span>
          </button>
          {onApplyToPayroll && (
            <button
              type="button"
              onClick={onApplyToPayroll}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow hover:bg-emerald-700 transition"
              title="اعتماد البصمات الحية مباشرة في حسابات رواتب الشهر"
            >
              <Sparkles size={15} />
              <span>تحديث مسير الرواتب بالبصمات</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric summary for Today */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">بصمات اليوم</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-ink">{formatNumber(metrics.totalToday)}</p>
          <p className="text-[11px] text-slate-400">موظف سجلوا حضورهم اليوم</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">حاضرون في الموعد</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{formatNumber(metrics.onTime)}</p>
          <p className="text-[11px] text-emerald-700">ضمن فترة السماح المحددة</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">متأخرون اليوم</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{formatNumber(metrics.late)}</p>
          <p className="text-[11px] text-amber-700">تجاوزوا موعد بدء الشيفت</p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">بصمة فردية (بدون انصراف)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <HelpCircle size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-900">{formatNumber(metrics.singlePunch)}</p>
          <p className="text-[11px] text-purple-700">بانتظار تسجيل الانصراف</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Filters */}
          <div className="flex rounded-lg border border-line p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                dateFilter === "today" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-ink"
              }`}
            >
              اليوم ({todayStr})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("month")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                dateFilter === "month" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-ink"
              }`}
            >
              هذا الشهر ({currentMonthStr})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                dateFilter === "all" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-ink"
              }`}
            >
              جميع السجلات
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("custom")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                dateFilter === "custom" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-ink"
              }`}
            >
              تاريخ مخصص
            </button>
          </div>

          {dateFilter === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs outline-none focus:border-primary"
            />
          )}

          {/* Department Filter */}
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
          >
            <option value="">كل الأقسام</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو كود الموظف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-line bg-slate-50/50 py-1.5 pr-8 pl-3 text-xs outline-none focus:border-primary focus:bg-white transition"
          />
        </div>
      </div>

      {/* Punches Data Sheet Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-line bg-slate-50/80 text-slate-600 font-extrabold">
              <tr>
                <th className="py-3 px-4">كود</th>
                <th className="py-3 px-4">اسم الموظف</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">حضور (Check-In)</th>
                <th className="py-3 px-4">انصراف (Check-Out)</th>
                <th className="py-3 px-4">شريط الحركات المسجلة</th>
                <th className="py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">لا توجد بصمات مسجلة في هذا النطاق.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      يمكنك استخدام زر "تسجيل بصمة يدوية" أو محاكاة البصمة من تبويب أجهزة البصمة.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const emp = employeeMap.get(String(log.employeeCode).trim());
                  const dept = emp?.departmentId ? deptMap.get(emp.departmentId) : "عام";
                  const st = computeLogStatus(log);
                  const punches = Array.isArray(log.punches) && log.punches.length > 0
                    ? log.punches
                    : [log.checkIn, log.checkOut].filter(Boolean);

                  return (
                    <tr key={`${log.employeeCode}-${log.date}-${index}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {log.employeeCode}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-ink">
                        {log.name || emp?.name || `موظف ${log.employeeCode}`}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {dept}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {log.date}
                      </td>
                      <td className="py-3 px-4">
                        {log.checkIn ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono font-bold text-emerald-800">
                            {log.checkIn}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.checkOut ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono font-bold text-blue-800">
                            {log.checkOut}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {punches.map((pTime, pIdx) => (
                            <span
                              key={pIdx}
                              className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700"
                              title={`حركة رقم ${pIdx + 1}`}
                            >
                              {pTime}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            st.tone === "emerald"
                              ? "bg-emerald-100 text-emerald-800"
                              : st.tone === "amber"
                              ? "bg-amber-100 text-amber-800"
                              : st.tone === "blue"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-slate-50 px-4 py-2.5 text-xs text-slate-500 flex justify-between items-center">
          <span>إجمالي السجلات المعروضة: <strong>{formatNumber(filteredLogs.length)}</strong></span>
          <span className="text-[11px] text-slate-400">ShiftPay HR Live Attendance Engine</span>
        </div>
      </div>

      {/* Manual Punch Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 left-4 rounded-full p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">تسجيل بصمة حية / يدوية</h3>
            <p className="text-xs text-slate-500 mb-4">
              إضافة بصمة لموظف يدوياً (تسمع فوراً في سجل الحضور ومسير الرواتب).
            </p>

            <form onSubmit={handleManualPunchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف</label>
                <select
                  required
                  value={manualForm.employeeCode}
                  onChange={(e) => setManualForm({ ...manualForm, employeeCode: e.target.value })}
                  className="w-full rounded-lg border border-line p-2 text-xs outline-none focus:border-primary"
                >
                  <option value="">-- اختر الموظف --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.code}>
                      {emp.code} — {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البصمة</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full rounded-lg border border-line p-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت البصمة (الساعة:الدقيقة)</label>
                  <input
                    type="time"
                    required
                    value={manualForm.time}
                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                    className="w-full rounded-lg border border-line p-2 text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: بصمة مبررة بإذن، نسيان كارت..."
                  value={manualForm.note}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  className="w-full rounded-lg border border-line p-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-black text-white hover:opacity-90 shadow"
                >
                  حفظ وتأكيد البصمة
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="rounded-lg border border-line px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
