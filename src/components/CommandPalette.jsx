import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  Building2,
  Clock,
  Users,
  UploadCloud,
  FileSpreadsheet,
  Archive,
  BarChart3,
  Settings,
  Sparkles,
  Download,
  CreditCard,
  UserCheck,
  ArrowRight,
  CornerDownLeft,
  X
} from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  employees = [],
  onSelectEmployee,
  onQuickAction
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigationItems = [
    { id: "dashboard", label: "لوحة التحكم", category: "التنقل", icon: LayoutDashboard },
    { id: "employees", label: "ملفات الموظفين والسلف", category: "التنقل", icon: Users },
    { id: "attendance", label: "سجلات الحضور والبصمة", category: "التنقل", icon: UploadCloud },
    { id: "reports", label: "كشوف الرواتب وقسائم الموظفين", category: "التنقل", icon: FileSpreadsheet },
    { id: "insights", label: "التحليلات والمؤشرات المالية", category: "التنقل", icon: BarChart3 },
    { id: "archive", label: "أرشيف الشهور السابقة", category: "التنقل", icon: Archive },
    { id: "departments", label: "إدارة الأقسام", category: "التنقل", icon: Building2 },
    { id: "shifts", label: "إدارة الشيفتات والورديات", category: "التنقل", icon: Clock },
    { id: "settings", label: "الإعدادات العامة وسياسات العمل", category: "التنقل", icon: Settings }
  ];

  const quickActionItems = [
    { id: "upload_attendance", label: "رفع ملف بصمة جديد", category: "إجراءات سريعة", icon: UploadCloud, action: () => onNavigate("attendance") },
    { id: "view_ai_insights", label: "فحص الذكاء الاصطناعي للرواتب والشذوذ", category: "إجراءات سريعة", icon: Sparkles, action: () => onNavigate("insights") },
    { id: "export_excel", label: "تصدير كشف الرواتب إلى Excel", category: "إجراءات سريعة", icon: Download, action: () => onQuickAction?.("excel") },
    { id: "export_accounting", label: "تصدير القيود اليومية المحاسبية", category: "إجراءات سريعة", icon: CreditCard, action: () => onQuickAction?.("accounting") },
    { id: "export_bank", label: "تصدير كشف التحويل البنكي", category: "إجراءات سريعة", icon: Download, action: () => onQuickAction?.("bank") }
  ];

  const employeeItems = useMemo(() => {
    return (employees || []).slice(0, 30).map((emp) => ({
      id: `emp-${emp.code}`,
      code: emp.code,
      label: `${emp.name} (${emp.code})`,
      category: "الموظفون",
      department: emp.department,
      icon: UserCheck,
      action: () => {
        onSelectEmployee?.(emp.code);
        onNavigate("employees");
      }
    }));
  }, [employees, onSelectEmployee, onNavigate]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...navigationItems, ...quickActionItems, ...employeeItems.slice(0, 5)];
    }
    const all = [...navigationItems, ...quickActionItems, ...employeeItems];
    return all.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      const matchDept = item.department?.toLowerCase().includes(q);
      return matchLabel || matchCat || matchCode || matchDept;
    });
  }, [query, employeeItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) executeItem(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else {
      onNavigate(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 sm:pt-20">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن شاشة، موظف، كشف حساب، أو إجراء سريع... (↑ ↓ للتنقل، Enter للاختيار)"
            className="w-full bg-transparent text-sm font-bold text-ink placeholder-slate-400 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 rounded p-1"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">
              لا توجد نتائج مطابقة لـ "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 cursor-pointer text-sm font-bold transition ${
                    isSelected
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-bold rounded-md px-2 py-0.5 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.category}
                    </span>
                    {isSelected && <CornerDownLeft size={14} className="text-white/80" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-line bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span>ShiftPay HR Command Palette</span>
          </div>
          <div className="flex items-center gap-3">
            <span>↑ ↓ للتنقل</span>
            <span>↵ للاختيار</span>
            <span>ESC للإغلاق</span>
          </div>
        </div>
      </div>
    </div>
  );
}
