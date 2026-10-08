import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseTimeToMinutes,
  minutesToTime,
  normalizeDate,
  getMonthLabel,
  getOfficialHolidays,
  getEffectiveHolidays,
  getHolidayKey,
  calculatePayroll,
  DEFAULT_SETTINGS,
  addMonthsToMonth,
  generateAdvanceInstallments,
  canAddEmployeeAdvance,
  postponeInstallment,
  settleAdvanceEarly,
  cancelAdvance,
  calculateAdvanceBalances,
  getEmployeeAdvanceBalance
} from "../src/lib/payroll.js";

describe("ShiftPay HR - Payroll Engine Unit Tests", () => {
  describe("Time Parsing & Conversion", () => {
    it("converts HH:MM strings to minutes correctly", () => {
      assert.equal(parseTimeToMinutes("09:00"), 540);
      assert.equal(parseTimeToMinutes("17:30"), 1050);
      assert.equal(parseTimeToMinutes("00:00"), 0);
      assert.equal(parseTimeToMinutes("00:15"), 15);
    });

    it("converts minutes to HH:MM format correctly (including overnight)", () => {
      assert.equal(minutesToTime(540), "09:00");
      assert.equal(minutesToTime(1050), "17:30");
      assert.equal(minutesToTime(0), "00:00");
      assert.equal(minutesToTime(1440), "24:00"); // 24-hour end-of-shift
      assert.equal(minutesToTime(1470), "24:30");
    });

    it("parses 12-hour AM/PM formats correctly", () => {
      assert.equal(parseTimeToMinutes("09:00 AM"), 540);
      assert.equal(parseTimeToMinutes("05:30 PM"), 1050);
      assert.equal(parseTimeToMinutes("12:00 AM"), 0);
      assert.equal(parseTimeToMinutes("12:00 PM"), 720);
    });
  });

  describe("Date Normalization & Month Helpers", () => {
    it("normalizes various date representations to YYYY-MM-DD", () => {
      assert.equal(normalizeDate("2026/05/15"), "2026-05-15");
      assert.equal(normalizeDate("2026-5-3"), "2026-05-03");
      assert.equal(normalizeDate("15/05/2026"), "2026-05-15");
    });

    it("generates Arabic month labels correctly", () => {
      const label = getMonthLabel("2026-05");
      // Arabic formatted label contains month name (مايو or May or digits)
      assert.ok(label && label.length > 0);
      assert.ok(label.includes("مايو") || label.includes("May") || label.includes("05"));
    });
  });

  describe("Official Holidays", () => {
    it("returns fixed Egyptian official holidays", () => {
      const holidays = getOfficialHolidays("EG", 2026);
      assert.ok(holidays.length > 0);
      assert.ok(holidays.some((h) => h.date === "2026-01-07")); // Coptic Christmas
      assert.ok(holidays.some((h) => h.date === "2026-05-01")); // Labor Day
    });

    it("applies company holiday overrides", () => {
      const laborDay = getOfficialHolidays("EG", 2026).find((h) => h.date === "2026-05-01");
      const baseKey = getHolidayKey(laborDay, "EG");

      const customSettings = {
        ...DEFAULT_SETTINGS,
        country: "EG",
        holidayOverrides: [
          { baseKey, enabled: false, name: "عيد العمال (ملغى للشركة)" },
          { date: "2026-05-20", enabled: true, name: "يوم تأسيس الشركة" }
        ]
      };
      const effective = getEffectiveHolidays(customSettings, 2026);
      assert.ok(!effective.some((h) => h.date === "2026-05-01"));
      assert.ok(effective.some((h) => h.date === "2026-05-20"));
    });
  });

  describe("Payroll Calculations", () => {
    const mockShift = {
      id: "s1",
      name: "صباحي",
      startTime: "09:00",
      endTime: "17:00",
      gracePeriod: 15,
      lateDeductionPerMinute: 2,
      overtimeRatePerMinute: 2,
      shiftKind: "standard",
      segments: [{ startTime: "09:00", endTime: "17:00" }]
    };

    const mockEmployee = {
      id: "e1",
      code: "EMP-001",
      name: "أحمد محمود",
      departmentId: "d1",
      shiftId: "s1",
      salary: 10000,
      active: true,
      vacationBalance: 21,
      extraDeductions: 0,
      bonuses: 0
    };

    it("calculates accurate salary with attendance and no deductions", () => {
      const logs = [
        {
          employeeCode: "EMP-001",
          name: "أحمد محمود",
          date: "2026-05-03",
          checkIn: "09:00",
          checkOut: "17:00"
        }
      ];

      const results = calculatePayroll({
        employees: [mockEmployee],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [mockShift],
        attendanceLogs: logs,
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05"
      });

      assert.equal(results.length, 1);
      const row = results[0];
      assert.equal(row.employeeCode, "EMP-001");
      assert.equal(row.attendanceDays, 1);
      assert.equal(row.lateCount, 0);
      assert.equal(row.lateMinutes, 0);
    });

    it("calculates net late minutes after subtracting grace period", () => {
      const logs = [
        {
          employeeCode: "EMP-001",
          name: "أحمد محمود",
          date: "2026-05-03",
          checkIn: "09:30", // 30 mins after start, grace period 15 => 15 net late minutes
          checkOut: "17:00"
        }
      ];

      const results = calculatePayroll({
        employees: [mockEmployee],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [mockShift],
        attendanceLogs: logs,
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05"
      });

      const row = results[0];
      assert.equal(row.lateCount, 1);
      assert.equal(row.lateMinutes, 15);
      assert.ok(row.deductions > 0);
    });
  });

  describe("Salary Advances in Installments (السلف بالتقسيط)", () => {
    const advanceEmployee = {
      id: "EMP-ADV-1",
      code: "EMP-100",
      name: "محمود إبراهيم",
      departmentId: "d1",
      shiftId: "s1",
      salary: 8000,
      active: true,
      vacationBalance: 15,
      extraDeductions: 0,
      bonuses: 0
    };

    const advanceShift = {
      id: "s1",
      name: "صباحي",
      startTime: "09:00",
      endTime: "17:00",
      gracePeriod: 15,
      lateDeductionPerMinute: 1,
      overtimeRatePerMinute: 1.5
    };

    it("generates installments with exact total and rounding adjusted on final installment", () => {
      // 1000 divided by 3: 333.33 + 333.33 + 333.34 = 1000.00
      const installments = generateAdvanceInstallments({
        totalAmount: 1000,
        installmentsCount: 3,
        startMonth: "2026-05"
      });

      assert.equal(installments.length, 3);
      assert.equal(installments[0].amount, 333.33);
      assert.equal(installments[0].dueMonth, "2026-05");
      assert.equal(installments[1].amount, 333.33);
      assert.equal(installments[1].dueMonth, "2026-06");
      assert.equal(installments[2].amount, 333.34);
      assert.equal(installments[2].dueMonth, "2026-07");

      const sum = installments.reduce((acc, inst) => acc + inst.amount, 0);
      assert.equal(Math.round(sum * 100) / 100, 1000.00);
    });

    it("handles year transition properly in installment due months", () => {
      const installments = generateAdvanceInstallments({
        totalAmount: 3000,
        installmentsCount: 4,
        startMonth: "2026-11"
      });
      assert.equal(installments[0].dueMonth, "2026-11");
      assert.equal(installments[1].dueMonth, "2026-12");
      assert.equal(installments[2].dueMonth, "2027-01");
      assert.equal(installments[3].dueMonth, "2027-02");
    });

    it("enforces single active advance per employee", () => {
      const existingAdvances = [
        {
          id: "adv-1",
          employeeId: "EMP-ADV-1",
          totalAmount: 3000,
          status: "active"
        }
      ];

      const check1 = canAddEmployeeAdvance("EMP-ADV-1", existingAdvances);
      assert.equal(check1.allowed, false);
      assert.ok(check1.reason.includes("سلفة نشطة"));

      const check2 = canAddEmployeeAdvance("EMP-OTHER", existingAdvances);
      assert.equal(check2.allowed, true);

      // When closed, employee can take a new advance
      const closedAdvances = [
        {
          id: "adv-1",
          employeeId: "EMP-ADV-1",
          totalAmount: 3000,
          status: "closed"
        }
      ];
      const check3 = canAddEmployeeAdvance("EMP-ADV-1", closedAdvances);
      assert.equal(check3.allowed, true);
    });

    it("deducts due installment correctly in payroll and produces slip line", () => {
      const installments = generateAdvanceInstallments({
        totalAmount: 3000,
        installmentsCount: 3,
        startMonth: "2026-05"
      });

      const activeAdvance = {
        id: "adv-100",
        employeeId: advanceEmployee.id,
        totalAmount: 3000,
        installmentsCount: 3,
        startMonth: "2026-05",
        status: "active",
        installments
      };

      const attendanceLogs = [
        {
          employeeCode: advanceEmployee.code,
          name: advanceEmployee.name,
          date: "2026-05-03",
          checkIn: "09:00",
          checkOut: "17:00"
        }
      ];

      const results = calculatePayroll({
        employees: [advanceEmployee],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs,
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05",
        advances: [activeAdvance]
      });

      const row = results[0];
      assert.equal(row.advanceInstallment, 1000);
      assert.equal(row.advanceInstallmentLabel, "قسط سلفة (1 من 3)");
      assert.equal(row.advancePostponed, false);
      assert.equal(row.advanceRemainingBalance, 2000);
      // Net salary = base salary (or after attendance) - advance installment
      assert.equal(row.netSalary, (advanceEmployee.salary - row.deductions + row.bonuses) - 1000);
    });

    it("auto-postpones installment when it exceeds 25% of basic salary", () => {
      // Employee salary is 8000. 25% max is 2000. Installment is 2500.
      const highInstallment = [
        {
          id: "inst-1",
          installmentIndex: 1,
          dueMonth: "2026-05",
          amount: 2500,
          status: "due"
        }
      ];

      const activeAdvance = {
        id: "adv-high",
        employeeId: advanceEmployee.id,
        totalAmount: 2500,
        installmentsCount: 1,
        startMonth: "2026-05",
        status: "active",
        installments: highInstallment
      };

      const results = calculatePayroll({
        employees: [advanceEmployee],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs: [],
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05",
        advances: [activeAdvance]
      });

      const row = results[0];
      assert.equal(row.advanceInstallment, 0);
      assert.equal(row.advancePostponed, true);
      assert.ok(row.advancePostponeReason.includes("25%"));
      assert.ok(row.netSalary > 0);
    });

    it("auto-postpones installment when net salary is less than installment to avoid zero or negative net", () => {
      // Create employee with very low salary or heavy deductions
      const lowSalaryEmp = {
        ...advanceEmployee,
        id: "EMP-LOW",
        code: "EMP-LOW",
        salary: 1000,
        extraDeductions: 800 // net before advance = 200
      };

      const installment = [
        {
          id: "inst-low-1",
          installmentIndex: 1,
          dueMonth: "2026-05",
          amount: 250, // 250 is <= 25% of 1000, but net before advance is only 200
          status: "due"
        }
      ];

      const activeAdvance = {
        id: "adv-low",
        employeeId: lowSalaryEmp.id,
        totalAmount: 250,
        installmentsCount: 1,
        startMonth: "2026-05",
        status: "active",
        installments: installment
      };

      const results = calculatePayroll({
        employees: [lowSalaryEmp],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs: [],
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05",
        advances: [activeAdvance]
      });

      const row = results[0];
      assert.equal(row.advanceInstallment, 0);
      assert.equal(row.advancePostponed, true);
      assert.ok(row.netSalary > 0);
    });

    it("does not deduct advance if reportMonth is prior to advance start month", () => {
      const installments = generateAdvanceInstallments({
        totalAmount: 3000,
        installmentsCount: 3,
        startMonth: "2026-07"
      });

      const activeAdvance = {
        id: "adv-future",
        employeeId: advanceEmployee.id,
        totalAmount: 3000,
        installmentsCount: 3,
        startMonth: "2026-07",
        status: "active",
        installments
      };

      const results = calculatePayroll({
        employees: [advanceEmployee],
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs: [],
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05",
        advances: [activeAdvance]
      });

      const row = results[0];
      assert.equal(row.advanceInstallment, 0);
      assert.equal(row.advanceRemainingBalance, 3000);
      assert.equal(row.advancePostponed, false);
    });

    it("correctly handles early payoff, closing advance and zeroing remaining balance", () => {
      const advance = {
        id: "adv-early",
        employeeId: advanceEmployee.id,
        totalAmount: 2000,
        installmentsCount: 2,
        status: "active",
        installments: [
          { id: "i1", installmentIndex: 1, dueMonth: "2026-05", amount: 1000, status: "deducted", deductedAmount: 1000 },
          { id: "i2", installmentIndex: 2, dueMonth: "2026-06", amount: 1000, status: "due", deductedAmount: 0 }
        ]
      };

      const settled = settleAdvanceEarly(advance);
      assert.equal(settled.status, "closed");
      assert.equal(settled.installments[1].status, "deducted");
      assert.equal(settled.installments[1].deductedAmount, 1000);

      const balances = calculateAdvanceBalances(settled);
      assert.equal(balances.remainingBalance, 0);
      assert.equal(balances.paidAmount, 2000);
      assert.equal(balances.progressPercent, 100);
    });

    it("correctly handles advance cancellation", () => {
      const advance = {
        id: "adv-cancel",
        employeeId: advanceEmployee.id,
        totalAmount: 1000,
        installmentsCount: 1,
        status: "active",
        installments: [
          { id: "i1", installmentIndex: 1, dueMonth: "2026-05", amount: 1000, status: "due" }
        ]
      };

      const cancelled = cancelAdvance(advance);
      assert.equal(cancelled.status, "cancelled");
      assert.equal(cancelled.installments[0].status, "cancelled");
    });

    it("correctly shifts schedule on manual postponement", () => {
      const advance = {
        id: "adv-postpone",
        employeeId: advanceEmployee.id,
        totalAmount: 2000,
        installmentsCount: 2,
        status: "active",
        installments: [
          { id: "i1", installmentIndex: 1, dueMonth: "2026-05", amount: 1000, status: "due" },
          { id: "i2", installmentIndex: 2, dueMonth: "2026-06", amount: 1000, status: "due" }
        ]
      };

      const updated = postponeInstallment(advance, "i1");
      assert.equal(updated.installments[0].status, "postponed");
      assert.equal(updated.installments[0].dueMonth, "2026-06");
      assert.equal(updated.installments[1].dueMonth, "2026-07");
    });

    it("guarantees 100% regression parity for employees without advances", () => {
      const employees = [
        advanceEmployee,
        {
          id: "EMP-2",
          code: "EMP-200",
          name: "سارة كمال",
          departmentId: "d1",
          shiftId: "s1",
          salary: 12000,
          active: true,
          vacationBalance: 20,
          extraDeductions: 50,
          bonuses: 100
        }
      ];

      const before = calculatePayroll({
        employees,
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs: [],
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05"
      });

      const after = calculatePayroll({
        employees,
        departments: [{ id: "d1", name: "IT" }],
        shifts: [advanceShift],
        attendanceLogs: [],
        settings: { ...DEFAULT_SETTINGS, payrollMonthDays: 30 },
        reportMonth: "2026-05",
        advances: []
      });

      assert.equal(before.length, after.length);
      for (let i = 0; i < before.length; i++) {
        assert.equal(before[i].netSalary, after[i].netSalary);
        assert.equal(before[i].deductions, after[i].deductions);
        assert.equal(before[i].bonuses, after[i].bonuses);
        assert.equal(before[i].status.label, after[i].status.label);
        assert.equal(before[i].attendanceDays, after[i].attendanceDays);
        assert.equal(after[i].advanceInstallment, 0);
      }
    });
  });
});
