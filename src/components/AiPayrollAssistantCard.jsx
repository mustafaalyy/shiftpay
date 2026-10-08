import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  Info
} from "lucide-react";
import { formatNumber } from "../lib/payroll";

export default function AiPayrollAssistantCard({ analysis, onNavigate, onFilterIssues }) {
  const [expanded, setExpanded] = useState(false);

  if (!analysis) return null;

  const { healthScore, status, anomalies = [], metrics = {}, insights = [] } = analysis;

  const statusConfig = {
    excellent: {
      color: "emerald",
      badgeText: "ممتاز وطبيعي",
      badgeClass: "bg-emerald-100 text-emerald-800",
      borderClass: "border-emerald-200",
      bgGradient: "from-emerald-50/60 via-slate-50 to-white",
      scoreColor: "text-emerald-700"
    },
    good: {
      color: "blue",
      badgeText: "جيد مع ملاحظات",
      badgeClass: "bg-blue-100 text-primary",
      borderClass: "border-blue-200",
      bgGradient: "from-blue-50/60 via-slate-50 to-white",
      scoreColor: "text-primary"
    },
    needs_review: {
      color: "amber",
      badgeText: "يحتاج تدقيق ومراجعة",
      badgeClass: "bg-amber-100 text-amber-800",
      borderClass: "border-amber-200",
      bgGradient: "from-amber-50/70 via-rose-50/20 to-white",
      scoreColor: "text-amber-700"
    }
  }[status] || {
    color: "blue",
    badgeText: "مكتمل",
    badgeClass: "bg-blue-100 text-primary",
    borderClass: "border-blue-200",
    bgGradient: "from-blue-50/60 to-white",
    scoreColor: "text-primary"
  };

  return (
    <section className={`rounded-2xl border ${statusConfig.borderClass} bg-gradient-to-br ${statusConfig.bgGradient} p-5 shadow-xs transition-all`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-ink">مساعد الذكاء الاصطناعي لفحص كشف الرواتب</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${statusConfig.badgeClass}`}>
                {statusConfig.badgeText}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              تحليل فوري للشذوذ، الخصومات غير الاعتيادية، ومطابقة ساعات العمل والسلف قبل اعتماد البنك.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left rtl:text-right">
            <span className="text-[11px] font-bold text-slate-400 block">مؤشر سلامة الكشف</span>
            <div className={`text-2xl font-black ${statusConfig.scoreColor}`}>
              %{formatNumber(healthScore)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            {expanded ? "إخفاء التفاصيل" : `عرض الملاحظات (${anomalies.length})`}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Summary Insights */}
      {insights.length > 0 && !expanded && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-line/60 text-xs font-bold text-slate-600">
          <span className="text-primary font-black">أبرز التوصيات:</span>
          {insights.slice(0, 2).map((ins, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2.5 py-1 border border-line/50">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {ins}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Details Section */}
      {expanded && (
        <div className="mt-5 space-y-4 pt-4 border-t border-line">
          {/* Insights recommendations list */}
          <div className="rounded-xl bg-white/90 p-3.5 border border-line">
            <h4 className="text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" />
              توصيات الفحص المالي والإداري
            </h4>
            <ul className="space-y-1.5 text-xs font-bold text-slate-600">
              {insights.map((ins, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {ins}
                </li>
              ))}
            </ul>
          </div>

          {/* Anomaly items */}
          {anomalies.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-700">
                الحالات التي رصدها الذكاء الاصطناعي ({anomalies.length}):
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                {anomalies.map((anom) => {
                  const isHigh = anom.severity === "high";
                  return (
                    <div
                      key={anom.id}
                      className={`rounded-xl border p-3.5 bg-white shadow-xs transition ${
                        isHigh ? "border-rose-200 bg-rose-50/30" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isHigh ? (
                            <AlertCircle size={16} className="text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                          )}
                          <span className="text-xs font-black text-ink">{anom.title}</span>
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {anom.employeeName}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-600 leading-relaxed">
                        {anom.description}
                      </p>
                      {anom.actionHint && (
                        <div className="mt-2 text-[11px] font-bold text-primary flex items-center gap-1">
                          <Info size={12} />
                          {anom.actionHint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-center text-xs font-bold text-emerald-800">
              ✓ لم يتم رصد أي شذوذ أو تفاوت غير اعتيادي في هذا الكشف. كافة الحسابات ضمن النطاق الطبيعي تماماً.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
