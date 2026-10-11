import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Sparkles,
  Calendar,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  X,
  Check
} from "lucide-react";

export default function NotificationBell({
  alerts = [],
  onNavigate,
  lang = "ar"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);
  const menuRef = useRef(null);
  const isEn = lang === "en";

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  const count = activeAlerts.length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const dismissAlert = (id, e) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleAction = (alert) => {
    setIsOpen(false);
    if (alert.onAction) {
      alert.onAction();
    } else if (alert.targetView && onNavigate) {
      onNavigate(alert.targetView);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition shadow-2xs ${
          isOpen ? "border-primary text-primary" : ""
        }`}
        title={isEn ? "Notifications & Alerts" : "مركز الإشعارات والتنبيهات"}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {count > 9 ? "+9" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isEn ? "right-0 sm:left-auto sm:right-0" : "left-0 sm:right-auto sm:left-0"
          } mt-2 w-80 sm:w-96 rounded-2xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line dark:border-slate-800 px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-primary dark:text-blue-400">
                <Bell size={14} />
              </span>
              <span className="text-sm font-extrabold text-ink dark:text-white">
                {isEn ? "Notifications & Tasks" : "التنبيهات والمهام المعلقة"}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">
                  {count}
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => setDismissedIds(alerts.map((a) => a.id))}
                className="text-[11px] font-bold text-slate-500 hover:text-primary transition"
              >
                {isEn ? "Mark all read" : "تحديد الكل كمقروء"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line dark:divide-slate-800">
            {activeAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Check size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? "All caught up! No pending alerts." : "رائع! لا توجد تنبيهات أو مهام معلقة."}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isEn
                    ? "Attendance, payroll and advances are in sync."
                    : "سجلات الحضور والرواتب والسلف منتظمة بالكامل."}
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const toneBg =
                  alert.type === "error"
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    : alert.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                    : alert.type === "ai"
                    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
                    : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400";

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAction(alert)}
                    className="group relative flex items-start gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${toneBg}`}>
                      {alert.icon || <AlertTriangle size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-ink dark:text-white truncate">
                          {alert.title}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => dismissAlert(alert.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded"
                          title={isEn ? "Dismiss" : "تجاهل"}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                        {alert.description}
                      </p>
                      {alert.actionLabel && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary dark:text-blue-400 hover:underline">
                          <span>{alert.actionLabel}</span>
                          {isEn ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
