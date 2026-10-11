import React, { useState, useEffect } from "react";
import { Clock, Calendar, Sparkles, MapPin } from "lucide-react";
import { getCountryProfile } from "../lib/payroll";

export default function LiveClockWidget({ countryCode = "EG", onSyncNow, lang = "ar" }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const country = getCountryProfile(countryCode);
  const isEn = lang === "en";

  const timeString = now.toLocaleTimeString(isEn ? "en-US" : "ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const dayName = now.toLocaleDateString(isEn ? "en-US" : "ar-EG", { weekday: "long" });
  const dateString = now.toLocaleDateString(isEn ? "en-US" : "ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 p-4 text-white shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sky-300 backdrop-blur-sm border border-white/20">
          <Clock size={24} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {timeString}
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {isEn ? "Live Clock" : "تحديث حي بالثانية"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-sky-200/90 font-medium mt-0.5">
            <Calendar size={13} className="text-sky-300" />
            <span>{isEn ? `${dayName}, ${dateString}` : `${dayName}، ${dateString}`}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-sky-100 border border-white/10">
          <MapPin size={13} className="text-sky-300" />
          <span className="font-bold">{isEn ? (country.localeLabel || country.name) : country.name}</span>
          <span className="text-sky-300/70">|</span>
          <span className="text-sky-200 font-medium">{country.currency}</span>
        </div>
        {onSyncNow && (
          <button
            type="button"
            onClick={onSyncNow}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500/30 hover:bg-sky-500/50 border border-sky-400/40 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
            title={isEn ? "Sync and update time now" : "مزامنة وتحديث التوقيت فوراً"}
          >
            <Sparkles size={13} className="text-sky-200" />
            <span>{isEn ? "Sync Now" : "تحديث الآن"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
