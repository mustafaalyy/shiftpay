import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, onUndo, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      border: "border-emerald-200 dark:border-emerald-900",
      bg: "bg-emerald-50 dark:bg-emerald-950/80",
      text: "text-emerald-900 dark:text-emerald-200",
      iconColor: "text-emerald-600"
    },
    error: {
      icon: AlertCircle,
      border: "border-rose-200 dark:border-rose-900",
      bg: "bg-rose-50 dark:bg-rose-950/80",
      text: "text-rose-900 dark:text-rose-200",
      iconColor: "text-rose-600"
    },
    warning: {
      icon: AlertTriangle,
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50 dark:bg-amber-950/80",
      text: "text-amber-900 dark:text-amber-200",
      iconColor: "text-amber-600"
    },
    info: {
      icon: Info,
      border: "border-blue-200 dark:border-blue-900",
      bg: "bg-blue-50 dark:bg-blue-950/80",
      text: "text-blue-900 dark:text-blue-200",
      iconColor: "text-primary"
    }
  }[type] || {
    icon: CheckCircle2,
    border: "border-slate-200 dark:border-slate-800",
    bg: "bg-white dark:bg-slate-900",
    text: "text-ink dark:text-white",
    iconColor: "text-primary"
  };

  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 left-6 z-60 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border ${config.border} ${config.bg} px-4 py-3.5 shadow-2xl backdrop-blur-md`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={`${config.iconColor} shrink-0`} />
          <p className={`text-sm font-bold ${config.text}`}>{message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onUndo && (
            <button
              type="button"
              onClick={() => {
                onUndo();
                onClose?.();
              }}
              className="rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 px-2.5 py-1 text-xs font-black transition cursor-pointer text-ink dark:text-white"
            >
              تراجع (Undo)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
