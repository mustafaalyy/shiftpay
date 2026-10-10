// ShiftPay HR - Bilingual Translations Dictionary (Arabic default, English supported)

export const translations = {
  ar: {
    // Navigation
    nav_dashboard: "لوحة التحكم",
    nav_departments: "الأقسام",
    nav_shifts: "النوبات والشيفتات",
    nav_employees: "الموظفون",
    nav_attendance: "رفع الحضور",
    nav_reports: "تقارير الرواتب",
    nav_archive: "الأرشيف",
    nav_insights: "التحليلات والمؤشرات",
    nav_settings: "الإعدادات",
    brand_subtitle: "إدارة الحضور والرواتب الذكية",

    // Top Bar & Common Actions
    add_company: "إضافة شركة / فرع",
    quick_search: "بحث سريع",
    cloud_save: "حفظ سحابي",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ",
    logout: "تسجيل خروج",
    company_account: "حساب الشركة",
    site_admin: "إدارة الموقع والأسعار",
    toggle_theme_dark: "الوضع الداكن",
    toggle_theme_light: "الوضع الفاتح",
    toggle_lang: "English",
    main_branch: "الفرع الرئيسي",

    // Dashboard & Live Attendance
    live_attendance_title: "سجل الحضور والبصمة الحي",
    live_attendance_subtitle: "متابعة لحظية لحركات الدخول والخروج مع المزامنة التلقائية",
    today_punches: "بصمات اليوم",
    present_now: "حاضرون الآن",
    late_today: "متأخرون اليوم",
    incomplete_punches: "بصمات ناقصة",
    record_manual_punch: "تسجيل بصمة يدوية",
    export_xlsx: "تصدير Excel",
    current_month: "الشهر الحالي",
    all_departments: "كافة الأقسام",
    search_employee_placeholder: "ابحث بالاسم أو الكود الوظيفي...",

    // Attendance Table Headers
    col_employee: "الموظف",
    col_code: "الكود",
    col_dept: "القسم",
    col_shift: "الوردية",
    col_checkin: "الدخول الأول",
    col_checkout: "الخروج الأخير",
    col_timeline: "مسار البصمات",
    col_status: "الحالة",

    // Statuses
    status_present: "حاضر",
    status_absent: "غائب",
    status_vacation: "إجازة",
    status_rest: "عطلة رسمية",
    status_weekend: "راحة أسبوعية",
    status_late: "متأخر",

    // Metrics
    metric_total_salary: "إجمالي الرواتب الأساسية",
    metric_net_salary: "صافي الرواتب المستحقة",
    metric_deductions: "إجمالي الخصومات",
    metric_overtime: "بدل الساعات الإضافية",
    metric_advances: "أقساط السلف المستحقة",

    // Tiers
    tier_basic: "الباقة الأساسية",
    tier_pro: "الباقة الاحترافية",
    tier_business: "باقة الأعمال الإقليمية",
    tier_single_company: "شركة واحدة في دولة واحدة",
    tier_multi_company: "حتى 3 شركات / فروع",
    tier_unlimited_company: "شركات وفروع غير محدودة",

    // Site Admin
    admin_title: "لوحة إدارة واجهة الموقع والأسعار",
    admin_desc: "تعديل نصوص الصفحة الرئيسية، الباقات، الأسعار، وأرقام التواصل",
    admin_login_title: "تسجيل دخول مدير الموقع",
    admin_passcode_placeholder: "أدخل رمز الأدمن (1122) أو البريد",
    admin_login_btn: "دخول لوحة الإدارة",
    admin_save_btn: "حفظ التعديلات ونشرها",
    admin_back_to_site: "العودة للموقع",
    admin_save_success: "تم حفظ ونشر التعديلات بنجاح."
  },
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_departments: "Departments",
    nav_shifts: "Shifts & Schedules",
    nav_employees: "Employees",
    nav_attendance: "Upload Attendance",
    nav_reports: "Payroll Reports",
    nav_archive: "Archive",
    nav_insights: "Analytics & Insights",
    nav_settings: "Settings",
    brand_subtitle: "Smart Attendance & Payroll",

    // Top Bar & Common Actions
    add_company: "Add Company / Branch",
    quick_search: "Quick Search",
    cloud_save: "Cloud Save",
    saving: "Saving...",
    saved: "Saved",
    logout: "Sign Out",
    company_account: "Company Profile",
    site_admin: "Site Admin & Pricing",
    toggle_theme_dark: "Dark Mode",
    toggle_theme_light: "Light Mode",
    toggle_lang: "العربية",
    main_branch: "Main Branch",

    // Dashboard & Live Attendance
    live_attendance_title: "Live Attendance & Punch Stream",
    live_attendance_subtitle: "Real-time biometric punch tracking and automated sync",
    today_punches: "Today's Punches",
    present_now: "Present Now",
    late_today: "Late Today",
    incomplete_punches: "Missing Punches",
    record_manual_punch: "Record Manual Punch",
    export_xlsx: "Export Excel",
    current_month: "Current Month",
    all_departments: "All Departments",
    search_employee_placeholder: "Search employee by name or code...",

    // Attendance Table Headers
    col_employee: "Employee",
    col_code: "Code",
    col_dept: "Department",
    col_shift: "Shift",
    col_checkin: "First Check-In",
    col_checkout: "Last Check-Out",
    col_timeline: "Punch Timeline",
    col_status: "Status",

    // Statuses
    status_present: "Present",
    status_absent: "Absent",
    status_vacation: "Vacation",
    status_rest: "Holiday",
    status_weekend: "Weekend",
    status_late: "Late",

    // Metrics
    metric_total_salary: "Total Base Salary",
    metric_net_salary: "Total Net Payable",
    metric_deductions: "Total Deductions",
    metric_overtime: "Total Overtime",
    metric_advances: "Active Advance Deductions",

    // Tiers
    tier_basic: "Basic Plan",
    tier_pro: "Professional Plan",
    tier_business: "Enterprise Plan",
    tier_single_company: "Single Company in 1 Country",
    tier_multi_company: "Up to 3 Companies / Branches",
    tier_unlimited_company: "Unlimited Companies & Branches",

    // Site Admin
    admin_title: "Site & Pricing Administration",
    admin_desc: "Manage homepage content, pricing tiers, limits, and contact channels",
    admin_login_title: "Site Administrator Access",
    admin_passcode_placeholder: "Enter admin passcode (1122) or email",
    admin_login_btn: "Access Admin Console",
    admin_save_btn: "Save & Publish Changes",
    admin_back_to_site: "Return to Homepage",
    admin_save_success: "Changes saved and published successfully."
  }
};

export function getTranslation(lang = "ar", key, fallback = "") {
  return translations[lang]?.[key] || translations.ar?.[key] || fallback || key;
}
