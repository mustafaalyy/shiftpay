export async function exportPayrollToXlsx({ rows, companyName, monthLabel, currency, shiftLabel = "النوبة" }) {
  const XLSX = await import("xlsx");
  const headers = [
    "كود الموظف",
    "اسم الموظف",
    "القسم",
    shiftLabel,
    "الحالة",
    "أيام الحضور",
    "مرات التأخير",
    "دقائق التأخير",
    "دقائق إضافية",
    "مكافأة الوقت الإضافي",
    "ملاحظات البصمة",
    "أيام الغياب",
    "الإجازات المستخدمة",
    "الخصومات",
    "المكافآت",
    "صافي الراتب"
  ];

  const body = rows.map((row) => [
    row.employeeCode,
    row.employeeName,
    row.department,
    row.shift,
    row.status.label,
    row.attendanceDays,
    row.lateCount,
    row.lateMinutes,
    row.overtimeMinutes,
    round(row.overtimeBonuses),
    row.incompleteSplitDays > 0 ? "شيفت مقسم غير مكتمل" : "",
    row.absenceDays,
    row.vacationUsage,
    round(row.deductions),
    round(row.bonuses),
    round(row.netSalary)
  ]);

  const sheetData = [
    [`تقرير الرواتب - ${monthLabel}`],
    [`الشركة: ${companyName}`],
    [`العملة: ${currency}`],
    [],
    headers,
    ...body
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }
  ];
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 }
  ];

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
  XLSX.writeFile(workbook, `ShiftPay-HR-${monthLabel}.xlsx`);
}

export async function exportAttendanceTemplate() {
  const XLSX = await import("xlsx");
  const directRows = [
    ["EmployeeCode", "Name", "Date", "CheckIn", "CheckOut"],
    ["E001", "أحمد محمود", "2026-05-03", "09:04", "17:02"],
    ["E002", "سارة علي", "2026-05-03", "09:18", "17:10"],
    ["E003", "محمود حسن", "2026-05-03", "10:00", "18:00"]
  ];
  const punchLogRows = [
    ["EmployeeCode", "Name", "Date", "Time", "Direction"],
    ["E001", "أحمد محمود", "2026-05-03", "09:04", "In"],
    ["E001", "أحمد محمود", "2026-05-03", "17:02", "Out"],
    ["E002", "سارة علي", "2026-05-03", "09:18", "In"]
  ];
  const multiPunchRows = [
    ["كود الموظف", "اسم الموظف", "التاريخ", "دخول 1", "خروج 1", "دخول 2", "خروج 2"],
    ["E001", "أحمد محمود", "2026-05-03", "09:05", "13:00", "17:10", "21:00"],
    ["E002", "سارة علي", "2026-05-03", "09:12", "13:05", "17:00", "21:20"]
  ];
  const directSheet = XLSX.utils.aoa_to_sheet(directRows);
  directSheet["!cols"] = [{ wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  const punchSheet = XLSX.utils.aoa_to_sheet(punchLogRows);
  punchSheet["!cols"] = [{ wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  const multiSheet = XLSX.utils.aoa_to_sheet(multiPunchRows);
  multiSheet["!cols"] = [{ wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, directSheet, "Direct In Out");
  XLSX.utils.book_append_sheet(workbook, punchSheet, "Punch Log");
  XLSX.utils.book_append_sheet(workbook, multiSheet, "Split Shift");
  XLSX.writeFile(workbook, "ShiftPay-HR-Attendance-Template.xlsx");
}

export async function exportEmployeeTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    ["EmployeeCode", "Name", "Department", "Shift", "Salary", "VacationBalance"],
    ["E001", "أحمد محمود", "Sales", "فترة صباحية", 12000, 21],
    ["E002", "سارة علي", "HR", "فترة مسائية", 15000, 18]
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 26 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  XLSX.writeFile(workbook, "ShiftPay-HR-Employees-Template.xlsx");
}

export async function exportElementToPdf(element, fileName) {
  if (!element) return;

  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const orientation = element.dataset?.pdfOrientation || "landscape";
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const sliceHeight = Math.floor((usableHeight * canvas.width) / usableWidth);

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const currentSliceHeight = Math.min(sliceHeight, canvas.height - sourceY);
    if (currentSliceHeight <= 0) break;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = currentSliceHeight;
    const context = pageCanvas.getContext("2d");
    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      currentSliceHeight,
      0,
      0,
      canvas.width,
      currentSliceHeight
    );

    if (pageIndex > 0) pdf.addPage();

    const imgHeight = (currentSliceHeight * usableWidth) / canvas.width;
    pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imgHeight);

    sourceY += currentSliceHeight;
    pageIndex += 1;
  }

  pdf.save(fileName);
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
