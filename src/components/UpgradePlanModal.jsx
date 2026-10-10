import React from "react";
import { X, Check, Sparkles, Building2, Globe, ShieldCheck, ArrowRight, Zap, PhoneCall } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "../lib/subscriptionTiers";

export default function UpgradePlanModal({ isOpen, onClose, currentTier = "free", triggerReason = "" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} />
            ترقية باقة ShiftPay HR
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            أدر شركات متعددة وفروع إقليمية بكل سهولة
          </h2>
          {triggerReason ? (
            <p className="text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              ⚠️ {triggerReason}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              الباقة الأساسية تتيح إدارة شركة واحدة في بلد واحد فقط. للعمل عبر عدة دول، اختر الباقة الأنسب لنمو شركتك.
            </p>
          )}
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {/* Free Tier */}
          <div className={`rounded-xl border p-5 transition flex flex-col justify-between ${
            currentTier === "free" ? "border-primary/50 bg-blue-50/30 ring-2 ring-primary/20" : "border-slate-200 bg-slate-50/50"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-slate-800 text-lg">{SUBSCRIPTION_TIERS.free.name}</span>
                {currentTier === "free" && (
                  <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full">باقتك الحالية</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{SUBSCRIPTION_TIERS.free.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-black text-slate-900">مجاناً</span>
                <span className="text-xs text-slate-500 mr-1">/ للأبد</span>
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {SUBSCRIPTION_TIERS.free.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled
                className="w-full rounded-lg bg-slate-200 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                الباقة الحالية
              </button>
            </div>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="relative rounded-xl border-2 border-primary bg-gradient-to-b from-blue-50/60 to-white p-5 shadow-lg flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm">
              الأكثر طلباً للشركات المتنامية 🔥
            </span>
            <div>
              <div className="flex items-center justify-between mb-2 pt-1">
                <span className="font-black text-primary text-lg">{SUBSCRIPTION_TIERS.pro.name}</span>
                <span className="text-[10px] font-black bg-blue-100 text-primary px-2 py-0.5 rounded-full">
                  حتى 3 شركات
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4">{SUBSCRIPTION_TIERS.pro.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-black text-blue-950">499</span>
                <span className="text-xs text-slate-600 mr-1">جنيه / شهرياً</span>
              </div>
              <div className="border-t border-blue-200 pt-3 space-y-2">
                {SUBSCRIPTION_TIERS.pro.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <a
                href="https://wa.me/201099999999?text=أرغب%20في%20ترقية%20حسابي%20في%20ShiftPay%20HR%20إلى%20باقة%20النمو%20الاحترافية%20(Pro)"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-2.5 text-xs font-black text-white hover:bg-primary/90 shadow-md transition"
              >
                <span>ترقية لباقة Pro الآن</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-xl border border-slate-300 bg-slate-900 text-white p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-white text-lg">{SUBSCRIPTION_TIERS.enterprise.name}</span>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  شركات غير محدودة
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4">{SUBSCRIPTION_TIERS.enterprise.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-black text-white">1,299</span>
                <span className="text-xs text-slate-300 mr-1">جنيه / شهرياً</span>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-2">
                {SUBSCRIPTION_TIERS.enterprise.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <a
                href="https://wa.me/201099999999?text=أرغب%20في%20الاشتراك%20في%20باقة%20المؤسسات%20الإقليمية%20(Enterprise)%20في%20ShiftPay%20HR"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-2.5 text-xs font-black text-slate-950 shadow-md transition"
              >
                <PhoneCall size={14} />
                <span>طلب اشتراك Enterprise مخصص</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center text-xs text-slate-500">
          🔒 بياناتك مشفرة ومحمية بالكامل — يمكنك تفعيل شركتك في السعودية أو مصر أو الإمارات خلال دقائق معدودة.
        </div>
      </div>
    </div>
  );
}
