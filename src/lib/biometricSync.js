// Biometric Device & Cloud Sync Engine for ShiftPay HR
// Supports ZKTeco ADMS Cloud Push, Hikvision, and LAN Sync Bridge

export const BIOMETRIC_DEVICE_MODELS = [
  { id: "zkteco_mb20", name: "ZKTeco MB20 (بصمة وجه وأصبع)", protocol: "adms_push" },
  { id: "zkteco_k40", name: "ZKTeco K40 / K50 (بصمة أصبع وكارت)", protocol: "adms_push" },
  { id: "zkteco_uface", name: "ZKTeco uFace 800 / SilkFP", protocol: "adms_push" },
  { id: "zkteco_in01", name: "ZKTeco IN01 / UA300 / F18", protocol: "adms_push" },
  { id: "hikvision_minmoe", name: "Hikvision MinMoe Face (DS-K1T)", protocol: "api_webhook" },
  { id: "dahua_asa", name: "Dahua ASA Series Terminal", protocol: "api_webhook" },
  { id: "generic_adms", name: "جهاز عام يدعم بروتوكول ADMS Push", protocol: "adms_push" },
  { id: "generic_lan", name: "جهاز شبكة داخلية قديم (TCP/IP 4370)", protocol: "lan_bridge" }
];

export const CONNECTION_PROTOCOLS = [
  {
    id: "adms_push",
    label: "سحابي مباشر (ADMS Cloud Push)",
    badge: "مباشر بدون وسيط",
    desc: "الجهاز يرسل البصمات تلقائياً عبر الإنترنت إلى سيرفر ShiftPay بمجرد ضغط البصمة دون الحاجة لـ IP ثابت."
  },
  {
    id: "lan_bridge",
    label: "وسيط شبكة محلية (Local LAN Bridge)",
    badge: "للأجهزة القديمة",
    desc: "سكربت أو برنامج خفيف يعمل على أي جهاز كمبيوتر متصل بنفس الراوتر مع ماكينة البصمة لسحب الحضور دورياً."
  },
  {
    id: "api_webhook",
    label: "Webhooks & REST API",
    badge: "تكامل احترافي",
    desc: "ربط مع أجهزة Hikvision أو سيرفرات BioTime / HikCentral عبر استدعاءات Webhook مباشرة."
  }
];

export function generateDeviceApiKey(companyId = "company", sn = "") {
  const cleanSn = String(sn || "DEV").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SPK_${cleanSn}_${random}`;
}

/**
 * Ingests a single punch event into the existing attendance logs.
 * Merges punches per employee and date:
 * - Computes checkIn as earliest punch
 * - Computes checkOut as latest punch (if more than one punch)
 * - Updates punches list
 */
export function ingestPunchEvent({ punch, existingLogs = [], employees = [] }) {
  const { employeeCode, date, time } = punch;
  if (!employeeCode || !date || !time) {
    throw new Error("بيانات البصمة غير مكتملة (الكود أو التاريخ أو الوقت ناقص).");
  }

  const employee = employees.find((e) => String(e.code) === String(employeeCode));
  const employeeName = employee?.name || punch.employeeName || `موظف ${employeeCode}`;

  const logs = [...existingLogs];
  const existingIndex = logs.findIndex(
    (log) => String(log.employeeCode) === String(employeeCode) && log.date === date
  );

  let updatedLog;

  if (existingIndex >= 0) {
    const current = logs[existingIndex];
    const currentPunches = Array.isArray(current.punches) ? [...current.punches] : [];
    if (!currentPunches.includes(time)) {
      currentPunches.push(time);
    }
    currentPunches.sort();

    const earliest = currentPunches[0];
    const latest = currentPunches.length > 1 ? currentPunches[currentPunches.length - 1] : "";

    updatedLog = {
      ...current,
      name: employeeName,
      checkIn: earliest,
      checkOut: latest,
      punches: currentPunches
    };
    logs[existingIndex] = updatedLog;
  } else {
    updatedLog = {
      employeeCode: String(employeeCode),
      name: employeeName,
      date,
      checkIn: time,
      checkOut: "",
      punches: [time]
    };
    logs.push(updatedLog);
  }

  // Sort logs by date desc, then employeeCode
  logs.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.employeeCode.localeCompare(b.employeeCode);
  });

  return {
    updatedLogs: logs,
    addedLog: updatedLog,
    employeeName
  };
}

/**
 * Generates ready-to-run Python Sync Agent script for local ZKTeco LAN devices
 */
export function generatePythonBridgeScript({
  companyName = "شركة تجريبية",
  apiKey = "SPK_DEMO_KEY",
  deviceIp = "192.168.1.201",
  devicePort = 4370,
  deviceSn = "ZK_SN_123456",
  endpointUrl = "https://shiftpay.online/api/biometric-push"
} = {}) {
  return `"""
=============================================================
  ShiftPay HR — ZKTeco Biometric LAN Bridge Agent
  الوسيط المحلي لمزامنة أجهزة بصمة ZKTeco مع ShiftPay HR
=============================================================
  الشركة: ${companyName}
  السيريال: ${deviceSn}
  الـ IP المحلي: ${deviceIp}:${devicePort}
=============================================================
المتطلبات:
  pip install pyzk requests
"""

import time
import requests
from datetime import datetime
from zk import ZK

DEVICE_IP = "${deviceIp}"
DEVICE_PORT = ${devicePort}
DEVICE_SN = "${deviceSn}"
SHIFTPAY_API_KEY = "${apiKey}"
SHIFTPAY_ENDPOINT = "${endpointUrl}"

def sync_attendance():
    print(f"[{datetime.now()}] جاري الاتصال بجهاز البصمة ({DEVICE_IP}:{DEVICE_PORT})...")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        conn.disable_device()
        print("✓ تم الاتصال بجهاز البصمة بنجاح!")
        
        attendances = conn.get_attendance()
        print(f"تم قراءة {len(attendances)} حركة حضور من ذاكرة الجهاز.")
        
        # تجميع البصمات الجديدة لإرسالها
        payload_records = []
        for att in attendances[-100:]:  # إرسال أحدث 100 بصمة
            payload_records.append({
                "employee_code": str(att.user_id),
                "timestamp": att.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "status": att.status,
                "punch": att.punch
            })
            
        if payload_records:
            headers = {
                "Authorization": f"Bearer {SHIFTPAY_API_KEY}",
                "Content-Type": "application/json"
            }
            body = {
                "sn": DEVICE_SN,
                "punches": payload_records
            }
            res = requests.post(SHIFTPAY_ENDPOINT, json=body, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                print(f"✓ تم إرسال {len(payload_records)} حركة حضور إلى ShiftPay HR بنجاح!")
            else:
                print(f"خطأ في استجابة السيرفر: {res.status_code} - {res.text}")
                
        conn.enable_device()
    except Exception as e:
        print(f"حدث خطأ أثناء الاتصال أو المزامنة: {e}")
    finally:
        if conn:
            conn.disconnect()

if __name__ == "__main__":
    print("بدء تشغيل وسيط ShiftPay HR للبصمة...")
    print("سيتم عمل فحص ومزامنة كل 60 ثانية. اضغط Ctrl+C للإيقاف.")
    while True:
        try:
            sync_attendance()
        except Exception as err:
            print("خطأ غير متوقع:", err)
        time.sleep(60)
`;
}
