// Subscription Plans & Company Limits Engine for ShiftPay HR

export const SUBSCRIPTION_TIERS = {
  free: {
    id: "free",
    name: "الباقة الأساسية",
    badge: "مجانية",
    price: 0,
    currency: "جنيه",
    maxCompanies: 1,
    maxEmployees: 50,
    maxBiometricDevices: 1,
    multiCountryAllowed: false,
    description: "للشركات الصغيرة الناشئة التي تحتاج لإدارة شركة واحدة وفروع محلية.",
    features: [
      "إدارة شركة واحدة فقط ببلد واحد",
      "حتى 50 موظفاً كحد أقصى",
      "حساب الرواتب والشيفتات والبصمة",
      "ربط ماكينة بصمة واحدة (سحابية أو محلية)",
      "تصدير كشوف البنوك والقيود المحاسبية",
      "سجل البصمات والحضور الحي"
    ]
  },
  pro: {
    id: "pro",
    name: "باقة النمو الاحترافية (Pro)",
    badge: "الأكثر طلباً",
    price: 499,
    currency: "جنيه",
    maxCompanies: 3,
    maxEmployees: 150,
    maxBiometricDevices: 5,
    multiCountryAllowed: true,
    description: "للشركات المتوسطة التي تمتلك عدة فروع أو أنشطة تجارية متعددة.",
    features: [
      "إدارة حتى 3 شركات مستقلة",
      "إمكانية فتح شركات في بلدان متعددة (مصر، السعودية، الإمارات)",
      "حتى 150 موظفاً",
      "ربط حتى 5 ماكينات بصمة سحابية",
      "موديول السلف والأقساط التلقائي",
      "ذكاء اصطناعي لكشف ثغرات وشذوذ الرواتب",
      "دعم فني سريع عبر واتساب"
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "باقة المؤسسات الإقليمية (Enterprise)",
    badge: "إقليمية غير محدودة",
    price: 1299,
    currency: "جنيه",
    maxCompanies: Infinity,
    maxEmployees: Infinity,
    maxBiometricDevices: Infinity,
    multiCountryAllowed: true,
    description: "للمجموعات والشركات الإقليمية الكبرى متعددة البلدان والكيانات القانونية.",
    features: [
      "شركات وفروع غير محدودة في كل الدول العربية",
      "عدد موظفين غير محدود",
      "ربط سحابي فوري لماكينات البصمة بدون حد أقصى",
      "متعدد العملات (جنيه، ريال، درهم، دينار)",
      "مدير حساب مخصص وتكامل مخصص مع أنظمة ERP",
      "نسخ احتياطي فوري وضمان تشغيل 99.9%"
    ]
  }
};

export function getTierConfig(tierId = "free") {
  return SUBSCRIPTION_TIERS[tierId] || SUBSCRIPTION_TIERS.free;
}

/**
 * Validates whether the user can create an additional company
 */
export function checkCompanyCreationLimit({ currentCompanies = [], userTier = "free" } = {}) {
  const tier = getTierConfig(userTier);
  const currentCount = Math.max(1, currentCompanies.length);

  if (currentCount >= tier.maxCompanies) {
    return {
      allowed: false,
      currentCount,
      maxAllowed: tier.maxCompanies,
      tierName: tier.name,
      reason: `لقد استهلكت الحد الأقصى للشركات المتاحة في ${tier.name} (${tier.maxCompanies} شركة فقط). لإضافة شركة جديدة في بلد آخر (مثل مصر أو السعودية أو الإمارات)، يرجى الترقية إلى باقة أعلى.`
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: tier.maxCompanies,
    tierName: tier.name
  };
}

/**
 * Validates whether an employee can be added given current tier capacity
 */
export function checkEmployeeLimit({ currentEmployeeCount = 0, userTier = "free" } = {}) {
  const tier = getTierConfig(userTier);

  if (currentEmployeeCount >= tier.maxEmployees) {
    return {
      allowed: false,
      currentCount: currentEmployeeCount,
      maxAllowed: tier.maxEmployees,
      tierName: tier.name,
      reason: `وصلت للحد الأقصى للموظفين في ${tier.name} (${tier.maxEmployees} موظف). يرجى الترقية لإضافة موظفين إضافيين.`
    };
  }

  return {
    allowed: true,
    currentCount: currentEmployeeCount,
    maxAllowed: tier.maxEmployees,
    tierName: tier.name
  };
}
