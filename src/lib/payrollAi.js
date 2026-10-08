/**
 * ShiftPay HR - Smart Payroll AI Assistant & Anomaly Detector
 * Analyzes payroll runs for discrepancies, outliers, compliance risks, and cost optimizations.
 */

export function analyzePayrollAnomalies({
  payrollRows = [],
  employees = [],
  settings = {},
  reportMonth = "",
  advances = []
}) {
  if (!payrollRows || payrollRows.length === 0) {
    return {
      healthScore: 100,
      status: "clean",
      totalIssues: 0,
      anomalies: [],
      metrics: {
        highDeductionsCount: 0,
        salaryDeviationCount: 0,
        incompletePunchCount: 0,
        overtimeOutlierCount: 0,
        postponedAdvanceCount: 0
      },
      insights: [
        "لا توجد بيانات رواتب كافية للتحليل بعد. قم برفع ملف الحضور أو اختيار تقرير محفوظ."
      ]
    };
  }

  const anomalies = [];
  let highDeductionsCount = 0;
  let salaryDeviationCount = 0;
  let incompletePunchCount = 0;
  let overtimeOutlierCount = 0;
  let postponedAdvanceCount = 0;

  payrollRows.forEach((row) => {
    const basicSalary = Number(row.salary) || 0;
    const netSalary = Number(row.netSalary) || 0;
    const deductions = Number(row.deductions) || 0;
    const overtimeBonuses = Number(row.overtimeBonuses) || 0;
    const advanceInstallment = Number(row.advanceInstallment) || 0;

    // 1. High Deduction Anomaly (> 30% of base salary)
    if (basicSalary > 0 && deductions / basicSalary >= 0.3) {
      highDeductionsCount++;
      anomalies.push({
        id: `deduction-${row.employeeCode}`,
        type: "high_deduction",
        severity: deductions / basicSalary >= 0.5 ? "high" : "medium",
        employeeCode: row.employeeCode,
        employeeName: row.employeeName,
        department: row.department,
        title: "خصومات مرتفعة غير معتادة",
        description: `إجمالي الخصومات (${Math.round(deductions)} ${settings.currency || "جنيه"}) يمثل ${Math.round((deductions / basicSalary) * 100)}% من الراتب الأساسي.`,
        actionHint: "راجع أيام الغياب وبصمات التأخير للتأكد من عدم وجود إجازة غير مسجلة."
      });
    }

    // 2. Significant Net Salary Deviation
    if (basicSalary > 0) {
      const ratio = netSalary / basicSalary;
      if (ratio > 1.45) {
        salaryDeviationCount++;
        anomalies.push({
          id: `spike-${row.employeeCode}`,
          type: "salary_spike",
          severity: "medium",
          employeeCode: row.employeeCode,
          employeeName: row.employeeName,
          department: row.department,
          title: "ارتفاع كبير في صافي الراتب",
          description: `الصافي (${Math.round(netSalary)}) أعلى من الراتب الأساسي بنسبة ${Math.round((ratio - 1) * 100)}% بسبب إضافي ومكافآت مرتفعة.`,
          actionHint: "تحقق من اعتماد ساعات العمل الإضافية من مدير القسم."
        });
      } else if (ratio < 0.5 && basicSalary > 500) {
        salaryDeviationCount++;
        anomalies.push({
          id: `drop-${row.employeeCode}`,
          type: "salary_drop",
          severity: "high",
          employeeCode: row.employeeCode,
          employeeName: row.employeeName,
          department: row.department,
          title: "انخفاض حاد في صافي المستحق",
          description: `صافي الراتب (${Math.round(netSalary)}) أقل من نصف الراتب الأساسي، مما قد يؤثر على التزامات الموظف المعيشية.`,
          actionHint: "راجع مبررات الخصم وإمكانية إعادة جدولة أي التزامات أو سلف."
        });
      }
    }

    // 3. Repeated Incomplete Punch
    if (row.incompleteSplitDays && row.incompleteSplitDays >= 2) {
      incompletePunchCount++;
      anomalies.push({
        id: `punch-${row.employeeCode}`,
        type: "incomplete_punch",
        severity: "medium",
        employeeCode: row.employeeCode,
        employeeName: row.employeeName,
        department: row.department,
        title: "تكرار البصمات غير المكتملة",
        description: `الموظف لديه ${row.incompleteSplitDays} أيام ذات بصمات ناقصة أو شيفت مقسوم غير مكتمل.`,
        actionHint: "استخدم أداة تسوية البصمات اليدوية لاحتساب الساعات الفعلية."
      });
    }

    // 4. Overtime Outlier (> 40% of salary or > 40 hours)
    if (row.overtimeMinutes && row.overtimeMinutes >= 2400) {
      overtimeOutlierCount++;
      anomalies.push({
        id: `overtime-${row.employeeCode}`,
        type: "overtime_outlier",
        severity: "low",
        employeeCode: row.employeeCode,
        employeeName: row.employeeName,
        department: row.department,
        title: "ساعات عمل إضافية مكثفة",
        description: `سجل الموظف ${Math.round(row.overtimeMinutes / 60)} ساعة إضافية خلال الشهر.`,
        actionHint: "تأكد من توافق ساعات العمل مع لوائح العمل المعمول بها والحد الأقصى للإضافي."
      });
    }
  });

  // 5. Advances Check
  (advances || []).forEach((adv) => {
    if (adv.status === "active") {
      const postponedInMonth = (adv.installments || []).find(
        (inst) => inst.dueMonth === reportMonth && inst.status === "postponed"
      );
      if (postponedInMonth) {
        postponedAdvanceCount++;
        anomalies.push({
          id: `advance-postponed-${adv.id}`,
          type: "advance_postponed",
          severity: "medium",
          employeeCode: adv.employeeCode,
          employeeName: adv.employeeName || adv.employeeCode,
          department: "",
          title: "قسط سلفة مؤجل تلقائياً",
          description: `تم تأجيل قسط شهر ${reportMonth} (${Math.round(postponedInMonth.amount)} ${settings.currency || "جنيه"}) لحماية صافي الراتب والالتزام بحد الـ 25%.`,
          actionHint: "القسط تم ترحيله للشهر التالي تلقائياً دون أي تدخل يدوي مطلوب."
        });
      }
    }
  });

  // Calculate overall Health Score (100 down based on issue weights)
  const penalty =
    highDeductionsCount * 8 +
    salaryDeviationCount * 5 +
    incompletePunchCount * 6 +
    overtimeOutlierCount * 3 +
    postponedAdvanceCount * 4;

  const healthScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

  // Generate automated actionable recommendations
  const insights = [];
  if (healthScore >= 92) {
    insights.push("كشف الرواتب متوازن ونظيف ولا توجد مؤشرات خطر حرجة.");
  } else if (healthScore >= 75) {
    insights.push("تم رصد بعض الملاحظات البسيطة التي يفضل مراجعتها قبل اعتماد التحويل البنكي.");
  } else {
    insights.push("يوجد عدد من الشذوذات والتفاوتات الملحوظة التي تتطلب مراجعة دقيقة من مدير الموارد البشرية.");
  }

  if (incompletePunchCount > 0) {
    insights.push(`يوجد ${incompletePunchCount} حالات بصمة ناقصة قد تؤدي لخصم غير مقصود من الموظفين.`);
  }
  if (highDeductionsCount > 0) {
    insights.push(`${highDeductionsCount} موظف تجاوزت خصوماتهم 30% من الراتب الأساسي.`);
  }
  if (postponedAdvanceCount > 0) {
    insights.push(`تم تفعيل الحماية المالية وتأجيل ${postponedAdvanceCount} أقساط سلف للحفاظ على صافي موجب.`);
  }

  return {
    healthScore,
    status: healthScore >= 90 ? "excellent" : healthScore >= 75 ? "good" : "needs_review",
    totalIssues: anomalies.length,
    anomalies,
    metrics: {
      highDeductionsCount,
      salaryDeviationCount,
      incompletePunchCount,
      overtimeOutlierCount,
      postponedAdvanceCount
    },
    insights
  };
}
