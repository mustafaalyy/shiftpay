import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
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
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-900",
      iconColor: "text-emerald-600"
    },
    error: {
      icon: AlertCircle,
      border: "border-rose-200",
      bg: "bg-rose-50",
      text: "text-rose-900",
      iconColor: "text-rose-600"
    },
    warning: {
      icon: AlertTriangle,
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-900",
      iconColor: "text-amber-600"
    },
    info: {
      icon: Info,
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-900",
      iconColor: "text-primary"
    }
  }[type] || {
    icon: CheckCircle2,
    border: "border-slate-200",
    bg: "bg-white",
    text: "text-ink",
    iconColor: "text-primary"
  };

  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border ${config.border} ${config.bg} px-4 py-3.5 shadow-xl`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={`${config.iconColor} shrink-0`} />
          <p className={`text-sm font-bold ${config.text}`}>{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 transition shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
