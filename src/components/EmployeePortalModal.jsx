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
  FileText
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
  onDownloadPdf
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!employee && !payrollRow)) return null;

  const empName = payrollRow?.employeeName || employee?.name || "الموظف";
  const empCode = payrollRow?.employeeCode || employee?.code || "";
  const empDept = payrollRow?.department || employee?.department || "عام";
  const currency = settings.currency || "جنيه";
  const netSalary = payrollRow?.netSalary || employee?.salary || 0;
  const basicSalary = payrollRow?.salary || employee?.salary || 0;
  const overtimeBonuses = payrollRow?.overtimeBonuses || 0;
  const deductions = payrollRow?.deductions || 0;
  const advanceInstallment = payrollRow?.advanceInstallment || 0;
  const advanceInstallmentLabel = payrollRow?.advanceInstallmentLabel || "";

  // Find active advance for this employee
  const activeAdvance = (advances || []).find(
    (adv) => (adv.employeeCode === empCode || adv.employeeId === employee?.id) && adv.status === "active"
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
    openWhatsAppSlip({ phone: employee?.phone, message });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-gradient-to-l from-primary/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white font-black text-lg">
              {empName[0]}
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">{empName}</h2>
              <p className="text-xs font-bold text-slate-500">
                كود: {empCode} • {empDept}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Net Salary Highlight Card */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white p-5 text-center shadow-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-primary">
              <Calendar size={13} />
              صافي راتب شهر {monthLabel}
            </span>
            <div className="mt-3 text-3xl font-black text-blue-950">
              {formatCurrency(netSalary, currency)}
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">
              الراتب الأساسي: {formatCurrency(basicSalary, currency)}
            </p>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-slate-50 p-3 text-center">
              <span className="text-[11px] font-bold text-slate-500 block">الأساسي</span>
              <span className="text-sm font-black text-ink mt-1 block">
                {formatNumber(Math.round(basicSalary))}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-700 block">إضافي ومكافآت</span>
              <span className="text-sm font-black text-emerald-800 mt-1 block">
                +{formatNumber(Math.round(overtimeBonuses))}
              </span>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center">
              <span className="text-[11px] font-bold text-rose-700 block">الخصومات</span>
              <span className="text-sm font-black text-rose-800 mt-1 block">
                -{formatNumber(Math.round(deductions))}
              </span>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-center">
              <span className="text-[11px] font-bold text-amber-700 block">قسط السلفة</span>
              <span className="text-sm font-black text-amber-800 mt-1 block">
                -{formatNumber(Math.round(advanceInstallment))}
              </span>
            </div>
          </div>

          {/* Active Advance Module Status (if any) */}
          {activeAdvance ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-700" />
                  <span className="text-sm font-black text-amber-950">سلفة نشطة بالتقسيط</span>
                </div>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  {activeAdvance.installments?.filter((i) => i.status === "deducted").length || 0} من {activeAdvance.installmentsCount} أقساط
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-amber-900">
                <div>
                  المبلغ الإجمالي: <span className="font-black">{formatCurrency(activeAdvance.totalAmount, currency)}</span>
                </div>
                <div>
                  الرصيد المتبقي: <span className="font-black">{formatCurrency(activeAdvance.remainingBalance ?? activeAdvance.totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <MessageCircle size={18} />
              مشاركة القسيمة عبر واتساب
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-slate-50 transition shadow-xs"
            >
              {copied ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Share2 size={18} />}
              {copied ? "تم نسخ نص القسيمة!" : "نسخ ملخص الراتب"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-slate-50 px-6 py-3 text-xs font-bold text-slate-500">
          <span>ShiftPay HR • بوابة قسائم الرواتب</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-extrabold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
