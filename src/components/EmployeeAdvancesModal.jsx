import React, { useState, useMemo } from "react";
import {
  X,
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  History,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Check
} from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  generateAdvanceInstallments,
  canAddEmployeeAdvance,
  postponeInstallment,
  settleAdvanceEarly,
  cancelAdvance,
  calculateAdvanceBalances
} from "../lib/payroll";

export default function EmployeeAdvancesModal({
  employee,
  advances = [],
  onSaveAdvance,
  onUpdateAdvance,
  onClose,
  currency = "جنيه",
  currentMonth = new Date().toISOString().slice(0, 7)
}) {
  const [activeTab, setActiveTab] = useState("current"); // "current" | "new" | "history"

  // Filter advances for this employee
  const employeeAdvances = useMemo(() => {
    return (advances || []).filter((adv) => adv.employeeId === employee.id);
  }, [advances, employee.id]);

  const activeAdvance = useMemo(() => {
    return employeeAdvances.find((adv) => adv.status === "active") || null;
  }, [employeeAdvances]);

  const pastAdvances = useMemo(() => {
    return employeeAdvances.filter((adv) => adv.status !== "active");
  }, [employeeAdvances]);

  const activeBalances = useMemo(() => {
    return calculateAdvanceBalances(activeAdvance);
  }, [activeAdvance]);

  // Form State for creating a new advance
  const [formData, setFormData] = useState({
    totalAmount: "",
    installmentsCount: 3,
    startMonth: currentMonth,
    notes: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'settle' | 'cancel' | 'settle_resigned', payload: any }

  const salary = Number(employee.salary) || 0;
  const maxAllowedInstallment = salary * 0.25;

  // Real-time preview of installments for the form
  const previewInstallments = useMemo(() => {
    const amount = Number(formData.totalAmount) || 0;
    const count = Math.max(1, parseInt(formData.installmentsCount, 10) || 1);
    const start = formData.startMonth || currentMonth;
    if (amount <= 0) return [];
    return generateAdvanceInstallments({
      totalAmount: amount,
      installmentsCount: count,
      startMonth: start
    });
  }, [formData.totalAmount, formData.installmentsCount, formData.startMonth, currentMonth]);

  const previewBaseInstallment = previewInstallments[0]?.amount || 0;
  const previewIsOver25Percent = previewBaseInstallment > maxAllowedInstallment;

  const handleCreateAdvance = (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const check = canAddEmployeeAdvance(employee.id, advances);
    if (!check.allowed) {
      setFormError(check.reason);
      return;
    }

    const amount = Number(formData.totalAmount);
    if (!amount || amount <= 0) {
      setFormError("يرجى إدخال مبلغ صحيح للسلفة أكبر من صفر.");
      return;
    }

    const count = parseInt(formData.installmentsCount, 10);
    if (!count || count < 1) {
      setFormError("يرجى تحديد عدد أقساط لا يقل عن قسط واحد.");
      return;
    }

    if (!formData.startMonth || !/^\d{4}-\d{2}$/.test(formData.startMonth)) {
      setFormError("يرجى تحديد شهر بدء الاستحقاق بصيغة YYYY-MM.");
      return;
    }

    const installments = generateAdvanceInstallments({
      totalAmount: amount,
      installmentsCount: count,
      startMonth: formData.startMonth
    });

    const newAdvance = {
      id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      employeeId: employee.id,
      totalAmount: amount,
      disbursementDate: new Date().toISOString().slice(0, 10),
      installmentsCount: count,
      startMonth: formData.startMonth,
      notes: formData.notes.trim(),
      status: "active",
      installments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveAdvance(newAdvance);
    setFormSuccess("تم إنشاء السلفة بنجاح وجدولة الأقساط.");
    setActiveTab("current");
    setFormData({
      totalAmount: "",
      installmentsCount: 3,
      startMonth: currentMonth,
      notes: ""
    });
  };

  const handlePostpone = (installmentId) => {
    if (!activeAdvance) return;
    const updated = postponeInstallment(activeAdvance, installmentId);
    onUpdateAdvance(updated);
  };

  const handleSettleEarly = () => {
    if (!activeAdvance) return;
    const settled = settleAdvanceEarly(activeAdvance);
    onUpdateAdvance(settled);
    setConfirmAction(null);
  };

  const handleCancelAdvance = () => {
    if (!activeAdvance) return;
    const cancelled = cancelAdvance(activeAdvance);
    onUpdateAdvance(cancelled);
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <Wallet size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-ink">سلف الموظف</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {employee.code}
                </span>
                {!employee.active && (
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                    مؤرشف / غير نشط
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {employee.name} • الراتب الأساسي: {formatCurrency(salary, currency)} (الحد الأقصى للقسط: {formatCurrency(maxAllowedInstallment, currency)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Inactive Employee Warning */}
        {!employee.active && activeAdvance && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0 text-amber-600" />
              <span>الموظف غير نشط وعليه رصيد سلفة متبقٍ قدره {formatCurrency(activeBalances.remainingBalance, currency)}.</span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: "settle_resigned" })}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-amber-700 transition"
            >
              خصم وتسوية الرصيد من المستحقات الأخيرة
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-slate-50/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold transition ${
              activeTab === "current"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wallet size={16} />
            <span>السلفة الحالية</span>
            {activeAdvance && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">
                نشطة
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold transition ${
              activeTab === "new"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus size={16} />
            <span>إضافة سلفة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold transition ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History size={16} />
            <span>السجل السابق ({pastAdvances.length})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Current Active Advance */}
          {activeTab === "current" && (
            <div>
              {activeAdvance ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">إجمالي مبلغ السلفة</p>
                      <p className="mt-1 text-2xl font-black text-ink">
                        {formatCurrency(activeAdvance.totalAmount, currency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        تاريخ الصرف: {activeAdvance.disbursementDate || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-line bg-emerald-50/50 p-4">
                      <p className="text-xs font-bold text-emerald-800">المبلغ المسدد</p>
                      <p className="mt-1 text-2xl font-black text-emerald-700">
                        {formatCurrency(activeBalances.paidAmount, currency)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600 font-bold">
                        {activeBalances.paidCount} من {activeBalances.totalCount} أقساط
                      </p>
                    </div>

                    <div className="rounded-xl border border-line bg-blue-50/50 p-4">
                      <p className="text-xs font-bold text-primary">الرصيد المتبقي</p>
                      <p className="mt-1 text-2xl font-black text-primary">
                        {formatCurrency(activeBalances.remainingBalance, currency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        أقساط متبقية: {activeBalances.totalCount - activeBalances.paidCount}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="rounded-xl border border-line bg-white p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-extrabold">
                      <span className="text-slate-600">نسبة سداد السلفة</span>
                      <span className="text-primary font-black">{activeBalances.progressPercent}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${activeBalances.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-600 font-bold">
                      {activeAdvance.notes ? (
                        <span>ملاحظات: {activeAdvance.notes}</span>
                      ) : (
                        <span>سلفة نشطة جارية الخصم شهرياً من كشف الراتب.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "settle" })}
                        className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        سداد مبكر (إغلاق السلفة)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "cancel" })}
                        className="rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition"
                      >
                        إلغاء السلفة
                      </button>
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div>
                    <h3 className="mb-3 text-base font-extrabold text-ink">جدول استحقاق الأقساط</h3>
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-line">
                          <tr>
                            <th className="px-4 py-3">القسط</th>
                            <th className="px-4 py-3">شهر الاستحقاق</th>
                            <th className="px-4 py-3">المبلغ</th>
                            <th className="px-4 py-3">الحالة</th>
                            <th className="px-4 py-3">تفاصيل الخصم</th>
                            <th className="px-4 py-3 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {activeAdvance.installments.map((inst, index) => {
                            const isDeducted = inst.status === "deducted";
                            const isPostponed = inst.status === "postponed";
                            const isDue = inst.status === "due";
                            const isCancelled = inst.status === "cancelled";

                            return (
                              <tr key={inst.id || index} className="hover:bg-slate-50/50 transition">
                                <td className="px-4 py-3 font-extrabold text-slate-700">
                                  قسط {inst.installmentIndex} من {activeAdvance.installments.length}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {inst.dueMonth}
                                </td>
                                <td className="px-4 py-3 font-extrabold text-ink">
                                  {formatCurrency(inst.amount, currency)}
                                </td>
                                <td className="px-4 py-3">
                                  {isDeducted && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                                      <CheckCircle2 size={12} /> تم الخصم
                                    </span>
                                  )}
                                  {isPostponed && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                                      <Clock size={12} /> مؤجل
                                    </span>
                                  )}
                                  {isDue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-primary">
                                      مستحق
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500">
                                      <Ban size={12} /> ملغي
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {isDeducted
                                    ? `خُصم ${inst.deductedAmount ? formatCurrency(inst.deductedAmount, currency) : ""}`
                                    : inst.notes || "—"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!isDeducted && !isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handlePostpone(inst.id)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                                      title="ترحيل القسط للشهر التالي"
                                    >
                                      <RotateCcw size={12} />
                                      <span>تأجيل شهر</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                    <Wallet size={28} />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-ink">لا توجد سلفة نشطة حالياً</h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                    لا يوجد أي أقساط مستحقة على هذا الموظف في الوقت الحالي. يمكنك إنشاء سلفة جديدة بجدولة أقساط مرنة.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                  >
                    <Plus size={16} />
                    إضافة سلفة للموظف
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Add New Advance */}
          {activeTab === "new" && (
            <div>
              {activeAdvance ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 space-y-3">
                  <div className="flex items-center gap-2 font-extrabold">
                    <AlertCircle size={20} className="text-amber-600" />
                    <span>يوجد سلفة نشطة بالفعل للموظف</span>
                  </div>
                  <p className="text-sm leading-6">
                    الموظف لديه سلفة نشطة حالياً بمبلغ {formatCurrency(activeAdvance.totalAmount, currency)} ورصيد متبقٍ {formatCurrency(activeBalances.remainingBalance, currency)}.
                    بحسب سياسة النظام، لا يمكن إضافة أكثر من سلفة نشطة واحدة في نفس الوقت.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("current")}
                      className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-black text-white hover:bg-amber-800 transition"
                    >
                      عرض السلفة الحالية وإدارتها
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateAdvance} className="space-y-6">
                  {formError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        مبلغ السلفة الإجمالي ({currency}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        placeholder="مثال: 3000"
                        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        عدد الأقساط الشهرية *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        required
                        value={formData.installmentsCount}
                        onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        أول شهر استحقاق (خصم) *
                      </label>
                      <input
                        type="month"
                        required
                        value={formData.startMonth}
                        onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ملاحظات أو سبب السلفة
                      </label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="مثال: سلفة علاجية أو ظروف طارئة"
                        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* 25% Rule Warning */}
                  {previewIsOver25Percent && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800 flex items-start gap-2.5">
                      <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-extrabold">تنبيه الحد الأقصى للاستقطاع (25%):</p>
                        <p className="mt-0.5 leading-5 font-medium">
                          قيمة القسط المقدرة ({formatCurrency(previewBaseInstallment, currency)}) تتجاوز الحد الأقصى المسموح نظامياً (25% من الراتب = {formatCurrency(maxAllowedInstallment, currency)}).
                          في حال تم الحفظ بهذا القسط، سيقوم محرك الرواتب بتأجيل الخصم تلقائياً للشهر التالي لحماية صافي راتب الموظف. يُفضل زيادة عدد الأقساط.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Schedule Preview */}
                  {previewInstallments.length > 0 && (
                    <div className="space-y-3 rounded-xl border border-line bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-ink">معاينة جدول الأقساط قبل الحفظ:</span>
                        <span className="text-xs font-bold text-slate-500">
                          {previewInstallments.length} أقساط • الإجمالي: {formatCurrency(formData.totalAmount, currency)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {previewInstallments.map((inst, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-line bg-white p-2.5 text-xs shadow-2xs"
                          >
                            <div className="flex justify-between font-bold text-slate-500">
                              <span>قسط {inst.installmentIndex}</span>
                              <span className="text-primary">{inst.dueMonth}</span>
                            </div>
                            <div className="mt-1 font-black text-ink">
                              {formatCurrency(inst.amount, currency)}
                              {idx === previewInstallments.length - 1 && inst.amount !== previewInstallments[0]?.amount && (
                                <span className="mr-1 text-2xs text-blue-600 font-bold">(فرق تقريب)</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("current")}
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                    >
                      حفظ وجدولة السلفة
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: History of Advances */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {pastAdvances.length > 0 ? (
                <div className="divide-y divide-line rounded-xl border border-line">
                  {pastAdvances.map((adv) => {
                    const balances = calculateAdvanceBalances(adv);
                    return (
                      <div key={adv.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-ink">
                              سلفة بمبلغ {formatCurrency(adv.totalAmount, currency)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                adv.status === "closed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {adv.status === "closed" ? "مكتملة ومسددة" : "ملغاة"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            بدأت في {adv.startMonth} • {adv.installmentsCount} أقساط • ملاحظات: {adv.notes || "—"}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-500">المسدد:</p>
                          <p className="text-sm font-black text-ink">
                            {formatCurrency(balances.paidAmount, currency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                  لا توجد سلف سابقة مغلقة أو مؤرشفة لهذا الموظف.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmAction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-ink">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <h4 className="text-lg font-extrabold">
                  {confirmAction.type === "settle"
                    ? "تأكيد السداد المبكر"
                    : confirmAction.type === "settle_resigned"
                    ? "تسوية مستحقات الموظف المستقيل"
                    : "تأكيد إلغاء السلفة"}
                </h4>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {confirmAction.type === "settle" &&
                  `هل أنت متأكد من تسوية كامل الرصيد المتبقي (${formatCurrency(activeBalances.remainingBalance, currency)}) وإغلاق السلفة الآن؟`}
                {confirmAction.type === "settle_resigned" &&
                  `هل أنت متأكد من خصم كامل الرصيد المتبقي (${formatCurrency(activeBalances.remainingBalance, currency)}) من مستحقات نهاية الخدمة وإغلاق السلفة نهائياً؟`}
                {confirmAction.type === "cancel" &&
                  "هل أنت متأكد من إلغاء السلفة؟ سيتم إيقاف خصم الأقساط المتبقية وتغيير حالة السلفة إلى ملغاة."}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmAction.type === "settle" || confirmAction.type === "settle_resigned") {
                      handleSettleEarly();
                    } else if (confirmAction.type === "cancel") {
                      handleCancelAdvance();
                    }
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-extrabold text-white transition ${
                    confirmAction.type === "cancel" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  تأكيد التنفيذ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
