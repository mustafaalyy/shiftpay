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
  X,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Bell,
  Plus,
  Send
} from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  employees = [],
  onSelectEmployee,
  onQuickAction,
  lang = "ar",
  onToggleTheme,
  onToggleLang,
  onOpenAuditTrail,
  onOpenPortal
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const isEn = lang === "en";

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigationItems = [
    { id: "dashboard", label: isEn ? "Dashboard" : "لوحة التحكم", category: isEn ? "Navigation" : "التنقل", icon: LayoutDashboard },
    { id: "requests", label: isEn ? "Requests & Approvals (ESS)" : "الطلبات والموافقات والخدمة الذاتية", category: isEn ? "Navigation" : "التنقل", icon: Send },
    { id: "employees", label: isEn ? "Employees & Advances" : "ملفات الموظفين والسلف", category: isEn ? "Navigation" : "التنقل", icon: Users },
    { id: "attendance", label: isEn ? "Attendance & Biometrics" : "سجلات الحضور والبصمة", category: isEn ? "Navigation" : "التنقل", icon: UploadCloud },
    { id: "reports", label: isEn ? "Payroll Reports & Slips" : "كشوف الرواتب وقسائم الموظفين", category: isEn ? "Navigation" : "التنقل", icon: FileSpreadsheet },
    { id: "insights", label: isEn ? "Financial Insights & AI" : "التحليلات والمؤشرات المالية", category: isEn ? "Navigation" : "التنقل", icon: BarChart3 },
    { id: "archive", label: isEn ? "Historical Archive" : "أرشيف الشهور السابقة", category: isEn ? "Navigation" : "التنقل", icon: Archive },
    { id: "departments", label: isEn ? "Department Management" : "إدارة الأقسام", category: isEn ? "Navigation" : "التنقل", icon: Building2 },
    { id: "shifts", label: isEn ? "Shifts & Working Hours" : "إدارة الشيفتات والورديات", category: isEn ? "Navigation" : "التنقل", icon: Clock },
    { id: "settings", label: isEn ? "System Settings & Policies" : "الإعدادات العامة وسياسات العمل", category: isEn ? "Navigation" : "التنقل", icon: Settings }
  ];

  const quickActionItems = [
    {
      id: "open_portal",
      label: isEn ? "Open Employee Self-Service Portal (ESS)" : "فتح بوابة الخدمة الذاتية للموظفين (ESS)",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: Users,
      action: () => onOpenPortal?.()
    },
    {
      id: "wps_export",
      label: isEn ? "Export Wage Protection System (WPS SIF)" : "تصدير حماية الأجور (WPS SIF)",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: ShieldCheck,
      action: () => onQuickAction?.("wps")
    },
    {
      id: "export_excel",
      label: isEn ? "Export Payroll to Excel" : "تصدير كشف الرواتب إلى Excel",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: Download,
      action: () => onQuickAction?.("excel")
    },
    {
      id: "export_bank",
      label: isEn ? "Export Bank Transfer Sheet" : "تصدير كشف التحويل البنكي",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: Download,
      action: () => onQuickAction?.("bank")
    },
    {
      id: "export_odoo",
      label: isEn ? "Export Odoo Journal CSV" : "تصدير قيود أودو المحاسبية (Odoo CSV)",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: CreditCard,
      action: () => onQuickAction?.("odoo")
    },
    {
      id: "upload_attendance",
      label: isEn ? "Upload Biometric Attendance File" : "رفع ملف بصمة جديد",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: UploadCloud,
      action: () => onNavigate("attendance")
    },
    {
      id: "view_ai_insights",
      label: isEn ? "Run AI Payroll Health Analysis" : "فحص الذكاء الاصطناعي للرواتب والشذوذ",
      category: isEn ? "Quick Actions" : "إجراءات سريعة",
      icon: Sparkles,
      action: () => onNavigate("insights")
    },
    ...(onToggleTheme
      ? [
          {
            id: "toggle_theme",
            label: isEn ? "Toggle Theme (Light / Dark Mode)" : "تبديل المظهر (فاتح / داكن)",
            category: isEn ? "Preferences" : "التفضيلات",
            icon: Moon,
            action: onToggleTheme
          }
        ]
      : []),
    ...(onToggleLang
      ? [
          {
            id: "toggle_lang",
            label: isEn ? "Switch Language (العربية / English)" : "تغيير لغة النظام (عربي / English)",
            category: isEn ? "Preferences" : "التفضيلات",
            icon: Globe,
            action: onToggleLang
          }
        ]
      : []),
    ...(onOpenAuditTrail
      ? [
          {
            id: "audit_trail",
            label: isEn ? "Security Audit Trail & Governance" : "سجل التتبع الأمني والحوكمة (Audit Trail)",
            category: isEn ? "Quick Actions" : "إجراءات سريعة",
            icon: ShieldCheck,
            action: onOpenAuditTrail
          }
        ]
      : []),
    ...(onOpenPortal
      ? [
          {
            id: "ess_portal",
            label: isEn ? "Employee Self-Service (ESS Portal)" : "بوابة الخدمة الذاتية للموظفين (ESS)",
            category: isEn ? "Quick Actions" : "إجراءات سريعة",
            icon: Users,
            action: onOpenPortal
          }
        ]
      : [])
  ];

  const employeeItems = useMemo(() => {
    return (employees || []).slice(0, 30).map((emp) => ({
      id: `emp-${emp.code}`,
      code: emp.code,
      label: `${emp.name} (${emp.code})`,
      category: isEn ? "Employees" : "الموظفون",
      department: emp.department,
      icon: UserCheck,
      action: () => {
        onSelectEmployee?.(emp.code);
        onNavigate("reports");
      }
    }));
  }, [employees, onSelectEmployee, onNavigate, isEn]);

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
  }, [query, navigationItems, quickActionItems, employeeItems]);

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
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-700/30 transition-all animate-in fade-in zoom-in-95 duration-150 border border-line dark:border-slate-800"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line dark:border-slate-800 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isEn
                ? "Search views, employees, reports, or actions... (↑ ↓ to navigate, Enter to select)"
                : "ابحث عن شاشة، موظف، كشف حساب، أو إجراء سريع... (↑ ↓ للتنقل، Enter للاختيار)"
            }
            className="w-full bg-transparent text-sm font-bold text-ink dark:text-white placeholder-slate-400 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded p-1"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">
              {isEn ? `No matching results for "${query}"` : `لا توجد نتائج مطابقة لـ "${query}"`}
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
                      ? "bg-primary text-white shadow-xs"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
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
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
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
        <div className="flex items-center justify-between border-t border-line dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>ShiftPay HR Command Palette</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{isEn ? "↑ ↓ Navigate" : "↑ ↓ للتنقل"}</span>
            <span>{isEn ? "↵ Select" : "↵ للاختيار"}</span>
            <span>{isEn ? "ESC Close" : "ESC للإغلاق"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
