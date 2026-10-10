import React from "react";
import { X, Check, Building2, Globe, ShieldCheck, ArrowLeft, MessageSquare, PhoneCall } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "../lib/subscriptionTiers";

export default function UpgradePlanModal({
  isOpen,
  onClose,
  currentTier = "free",
  triggerReason = "",
  siteContent = null
}) {
  if (!isOpen) return null;

  const landing = siteContent?.landing || {};
  const supportPhone = (siteContent?.supportPhone || "").replace(/[^0-9]/g, "") || "201099999999";

  // Synchronize tier information directly with landing page pricing
  const basicPlan = {
    name: landing.pricingBasic?.name || SUBSCRIPTION_TIERS.free.name,
    desc: landing.pricingBasic?.desc || SUBSCRIPTION_TIERS.free.description,
    amount: landing.pricingBasic?.amount || "مجاناً",
    period: landing.pricingBasic?.period || "سنوياً",
    features: landing.pricingBasic?.features || SUBSCRIPTION_TIERS.free.features
  };

  const proPlan = {
    badge: landing.pricingPro?.badge || "الأكثر طلباً",
    name: landing.pricingPro?.name || SUBSCRIPTION_TIERS.pro.name,
    desc: landing.pricingPro?.desc || SUBSCRIPTION_TIERS.pro.description,
    amount: landing.pricingPro?.amount || "3,500",
    period: landing.pricingPro?.period || "سنوياً",
    features: landing.pricingPro?.features || SUBSCRIPTION_TIERS.pro.features
  };

  const businessPlan = {
    name: landing.pricingBusiness?.name || SUBSCRIPTION_TIERS.enterprise.name,
    desc: landing.pricingBusiness?.desc || SUBSCRIPTION_TIERS.enterprise.description,
    amount: landing.pricingBusiness?.amount || "7,500",
    period: landing.pricingBusiness?.period || "سنوياً",
    features: landing.pricingBusiness?.features || SUBSCRIPTION_TIERS.enterprise.features
  };

  const whatsappProUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(
    `السلام عليكم، أود ترقية حساب شركتي في ShiftPay HR إلى ${proPlan.name}.`
  )}`;

  const whatsappBusinessUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(
    `السلام عليكم، أود تفعيل باقة المؤسسات والأعمال (${businessPlan.name}) لعدة فروع وشركات في ShiftPay HR.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="إغلاق النافذة"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3 py-1 text-xs font-bold text-primary dark:text-blue-400">
            <Building2 size={13} />
            ترقية باقة ShiftPay HR
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            اختر الباقة المناسبة لحجم أعمالك وفروعك
          </h2>
          {triggerReason ? (
            <p className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
              {triggerReason}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الباقة الأساسية تتيح إدارة شركة واحدة في دولة واحدة. لإضافة فروع أو شركات في مصر والسعودية والإمارات، اختر الباقة المناسبة.
            </p>
          )}
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {/* Basic Tier */}
          <div
            className={`rounded-xl border p-5 transition flex flex-col justify-between ${
              currentTier === "free"
                ? "border-primary/60 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-primary/30"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{basicPlan.name}</span>
                {currentTier === "free" && (
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                    باقتك الحالية
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{basicPlan.desc}</p>
              <div className="mb-4">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{basicPlan.amount}</span>
                {basicPlan.period ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">/ {basicPlan.period}</span>
                ) : null}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                {basicPlan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled
                className="w-full rounded-lg bg-slate-200 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
              >
                الباقة المفعلة حالياً
              </button>
            </div>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="relative rounded-xl border-2 border-primary bg-white dark:bg-slate-900 p-5 shadow-lg flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-xs">
              {proPlan.badge}
            </span>
            <div>
              <div className="flex items-center justify-between mb-2 pt-1">
                <span className="font-extrabold text-primary dark:text-blue-400 text-base">{proPlan.name}</span>
                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                  حتى 3 شركات
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{proPlan.desc}</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{proPlan.amount}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">جنيه / {proPlan.period}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                {proPlan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                    <Check size={14} className="text-primary shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <a
                href={whatsappProUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/90 shadow-xs transition"
              >
                <span>طلب الترقية للباقة الاحترافية</span>
                <ArrowLeft size={14} />
              </a>
            </div>
          </div>

          {/* Business / Enterprise Tier */}
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-white p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-white text-base">{businessPlan.name}</span>
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  شركات غير محدودة
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4">{businessPlan.desc}</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-white">{businessPlan.amount}</span>
                <span className="text-xs text-slate-300 mr-1.5">جنيه / {businessPlan.period}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 space-y-2">
                {businessPlan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <a
                href={whatsappBusinessUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-white hover:bg-slate-100 py-2.5 text-xs font-bold text-slate-950 shadow-xs transition"
              >
                <PhoneCall size={14} />
                <span>تواصل معنا للاشتراك المخصص</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-3 text-center text-xs text-slate-600 dark:text-slate-400">
          تفعيل فوري لشركتك وفروعك في مصر والمملكة العربية السعودية والإمارات مع دعم فني مخصص.
        </div>
      </div>
    </div>
  );
}
