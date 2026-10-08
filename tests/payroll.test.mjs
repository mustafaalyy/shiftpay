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
  DEFAULT_SETTINGS
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
});
