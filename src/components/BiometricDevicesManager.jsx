import React, { useState } from "react";
import {
  Cpu,
  Wifi,
  WifiOff,
  Plus,
  Play,
  Terminal,
  Copy,
  Check,
  Trash2,
  HelpCircle,
  Clock,
  MapPin,
  Key,
  Download,
  AlertCircle,
  Sparkles,
  Laptop
} from "lucide-react";
import {
  BIOMETRIC_DEVICE_MODELS,
  CONNECTION_PROTOCOLS,
  generateDeviceApiKey,
  generatePythonBridgeScript
} from "../lib/biometricSync";

export default function BiometricDevicesManager({
  devices = [],
  onSaveDevice,
  onDeleteDevice,
  onSimulatePunch,
  employees = [],
  companyName = "الشركة",
  settings = {}
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGuideDevice, setSelectedGuideDevice] = useState(null);
  const [simulatorDevice, setSimulatorDevice] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  // New Device Form State
  const [form, setForm] = useState({
    name: "",
    serialNumber: "",
    deviceModel: BIOMETRIC_DEVICE_MODELS[0].name,
    protocol: "adms_push",
    ipAddress: "192.168.1.201",
    port: 4370,
    location: "المقر الرئيسي"
  });

  // Simulator Form State
  const [simForm, setSimForm] = useState({
    employeeCode: employees[0]?.code || "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5)
  });

  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.serialNumber) return;

    const newDevice = {
      id: "dev_" + Math.random().toString(36).substring(2, 9),
      name: form.name.trim(),
      serialNumber: form.serialNumber.trim(),
      deviceModel: form.deviceModel,
      protocol: form.protocol,
      ipAddress: form.ipAddress,
      port: Number(form.port) || 4370,
      location: form.location.trim(),
      apiKey: generateDeviceApiKey("company", form.serialNumber),
      status: "idle",
      lastSyncAt: null,
      lastPunchCount: 0,
      createdAt: new Date().toISOString()
    };

    onSaveDevice(newDevice);
    setIsAddModalOpen(false);
    setForm({
      name: "",
      serialNumber: "",
      deviceModel: BIOMETRIC_DEVICE_MODELS[0].name,
      protocol: "adms_push",
      ipAddress: "192.168.1.201",
      port: 4370,
      location: "المقر الرئيسي"
    });
  };

  const handleSimulateSubmit = (e) => {
    e.preventDefault();
    if (!simForm.employeeCode || !simForm.date || !simForm.time) return;

    onSimulatePunch({
      employeeCode: simForm.employeeCode,
      date: simForm.date,
      time: simForm.time,
      deviceSn: simulatorDevice?.serialNumber || "SIMULATOR"
    });

    setSimulatorDevice(null);
  };

  const downloadPythonScript = (device) => {
    const script = generatePythonBridgeScript({
      companyName,
      apiKey: device.apiKey,
      deviceIp: device.ipAddress || "192.168.1.201",
      devicePort: device.port || 4370,
      deviceSn: device.serialNumber
    });

    const blob = new Blob([script], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shiftpay-bridge-${device.serialNumber}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = devices.filter((d) => d.status === "online").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Overview */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Cpu size={18} />
              </span>
              <h2 className="text-xl font-black text-ink">أجهزة البصمة والربط السحابي المباشر</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500">
              اربط ماكينات البصمة (ZKTeco أو Hikvision) مباشرة بدون سحب يدوي للملفات، لتصل حركات الحضور في نفس الثانية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:bg-blue-800"
            >
              <Plus size={16} />
              إضافة ماكينة بصمة
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatorDevice(devices[0] || { name: "ماكينة افتراضية", serialNumber: "DEMO_SN" });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary"
            >
              <Play size={16} className="text-emerald-600" />
              محاكي البصمة اللحظية
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-400">إجمالي الأجهزة</p>
            <p className="mt-1 text-xl font-black text-ink">{devices.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-400">حالة الاتصال</p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-black text-emerald-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeCount} متصل
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-400">بروتوكول السيرفر</p>
            <p className="mt-1 text-sm font-black text-primary">ADMS Push 443/80</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-400">نطاق الحضور السحابي</p>
            <p className="mt-1 text-sm font-black text-slate-700 truncate" title="cloud.shiftpayhr.com">
              cloud.shiftpayhr.com
            </p>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-primary">
            <Cpu size={28} />
          </div>
          <h3 className="mt-4 text-lg font-black text-ink">لم تقم بإضافة ماكينة بصمة حتى الآن</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 font-bold leading-relaxed">
            أضف رقم السيريال الخاص بماكينة البصمة (الموجود خلف الجهاز أو في القائمة)، لتحصل على إعدادات الربط المباشر أو سكربت المزامنة لشبكتك المحلية.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-blue-800"
            >
              <Plus size={16} />
              إضافة أول ماكينة بصمة
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const isOnline = device.status === "online";
            return (
              <div
                key={device.id}
                className="group relative flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-ink text-base">{device.name}</h4>
                      <p className="mt-0.5 text-xs font-bold text-slate-400">{device.deviceModel}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${
                        isOnline
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isOnline ? (
                        <>
                          <Wifi size={12} className="text-emerald-600" />
                          متصل
                        </>
                      ) : (
                        <>
                          <WifiOff size={12} className="text-slate-400" />
                          في الانتظار
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs font-bold text-slate-600">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">السيريال (SN):</span>
                      <span className="font-mono font-black text-ink">{device.serialNumber}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">طريقة الاتصال:</span>
                      <span className="text-primary font-black">
                        {device.protocol === "adms_push" ? "سحابي (ADMS)" : "شبكة محلية (Bridge)"}
                      </span>
                    </div>

                    {device.location && (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin size={11} />
                          الموقع:
                        </span>
                        <span>{device.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        آخر مزامنة:
                      </span>
                      <span>
                        {device.lastSyncAt
                          ? new Date(device.lastSyncAt).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "لم يسجل بعد"}
                      </span>
                    </div>
                  </div>

                  {/* API Key Box */}
                  <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400 flex items-center gap-1">
                        <Key size={11} />
                        مفتاح الأمان (API Key):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(device.apiKey, device.id)}
                        className="text-primary hover:underline flex items-center gap-1 font-black"
                      >
                        {copiedKey === device.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKey === device.id ? "تم النسخ" : "نسخ"}
                      </button>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-700 truncate">{device.apiKey}</p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 border-t border-line pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedGuideDevice(device)}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-primary hover:text-primary"
                      title="دليل ضبط الماكينة"
                    >
                      <HelpCircle size={13} />
                      طريقة الضبط
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorDevice(device)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
                      title="محاكاة بصمة من هذا الجهاز"
                    >
                      <Play size={12} />
                      تجربة بصمة
                    </button>
                    {device.protocol === "lan_bridge" && (
                      <button
                        type="button"
                        onClick={() => downloadPythonScript(device)}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-blue-100"
                        title="تحميل سكربت المزامنة المحلي"
                      >
                        <Download size={12} />
                        السكربت
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteDevice(device.id)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="حذف الماكينة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add Device */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Plus size={18} />
                </span>
                <h3 className="text-lg font-black text-ink">إضافة ماكينة بصمة جديدة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-ink font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الماكينة</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: ماكينة الاستقبال، ماكينة المصنع..."
                  className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">موديل الماكينة</label>
                  <select
                    value={form.deviceModel}
                    onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                  >
                    {BIOMETRIC_DEVICE_MODELS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرقم التسلسلي (SN)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    placeholder="مثال: CLG82039019"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الاتصال</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CONNECTION_PROTOCOLS.slice(0, 2).map((proto) => (
                    <label
                      key={proto.id}
                      className={`cursor-pointer rounded-lg border p-3 text-right transition ${
                        form.protocol === proto.id
                          ? "border-primary bg-blue-50/60 shadow-xs"
                          : "border-line bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="protocol"
                          value={proto.id}
                          checked={form.protocol === proto.id}
                          onChange={() => setForm({ ...form, protocol: proto.id })}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-black text-ink">{proto.label}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500 font-bold leading-normal">
                        {proto.desc}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {form.protocol === "lan_bridge" && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الـ IP الداخلي</label>
                    <input
                      type="text"
                      value={form.ipAddress}
                      onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                      className="w-full rounded border border-line bg-white px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المنفذ (Port)</label>
                    <input
                      type="number"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: e.target.value })}
                      className="w-full rounded border border-line bg-white px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموقع أو الفرع</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="مثال: الطابق الأرضي، الاستقبال، المعمل..."
                  className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-black text-white hover:bg-blue-800 transition"
                >
                  حفظ الماكينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Punch Simulator */}
      {simulatorDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Play size={16} />
                </span>
                <h3 className="text-base font-black text-ink">محاكي البصمة اللحظية</h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorDevice(null)}
                className="text-slate-400 hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-500 leading-relaxed">
              محاكاة إرسال بصمة حية من ماكينة <span className="text-primary font-black">{simulatorDevice.name}</span> لاختبار ظهورها في كشف الحضور وحسابات المرتب فوراً.
            </p>

            <form onSubmit={handleSimulateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف</label>
                <select
                  value={simForm.employeeCode}
                  onChange={(e) => setSimForm({ ...simForm, employeeCode: e.target.value })}
                  className="w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-bold text-ink outline-none focus:border-primary"
                >
                  {employees.map((emp) => (
                    <option key={emp.code} value={emp.code}>
                      {emp.name} ({emp.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={simForm.date}
                    onChange={(e) => setSimForm({ ...simForm, date: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوقت</label>
                  <input
                    type="time"
                    required
                    value={simForm.time}
                    onChange={(e) => setSimForm({ ...simForm, time: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setSimulatorDevice(null)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition"
                >
                  <Sparkles size={13} />
                  تسجيل البصمة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Device Configuration Guide */}
      {selectedGuideDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-primary">
                  <Terminal size={18} />
                </span>
                <h3 className="text-base font-black text-ink">
                  دليل ضبط الماكينة: {selectedGuideDevice.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuideDevice(null)}
                className="text-slate-400 hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-bold text-slate-700 leading-relaxed">
              {selectedGuideDevice.protocol === "adms_push" ? (
                <>
                  <div className="rounded-lg bg-blue-50 p-3.5 border border-blue-200 text-primary">
                    <p className="font-black text-sm mb-1">خطوات ضبط أجهزة ZKTeco ذات السيرفر السحابي (ADMS):</p>
                    <p className="text-xs text-blue-900">
                      هذه الإعدادات تتم مرة واحدة في شاشة ماكينة البصمة نفسها دون الحاجة لأي جهاز كمبيوتر بجوارها.
                    </p>
                  </div>

                  <ol className="space-y-3 list-decimal list-inside text-slate-600 pr-1">
                    <li>
                      اضغط زر <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-ink font-black">M/OK</span> لفتح القائمة الرئيسية في جهاز البصمة.
                    </li>
                    <li>
                      اختر <span className="font-black text-ink">الاتصال (Comm.)</span> ثم اضغط <span className="font-black text-ink">إعدادات خادم السحابة (Cloud Server Settings)</span> أو <span className="font-black text-ink">ADMS</span>.
                    </li>
                    <li>
                      فعّل خيار <span className="font-black text-emerald-700">تمكين خادم السحابة (Enable Cloud Server) = نعم</span>.
                    </li>
                    <li>
                      في خانة <span className="font-black text-ink">عنوان الخادم (Server Address)</span> اكتب:
                      <div className="mt-1 flex items-center justify-between rounded bg-slate-100 px-3 py-1.5 font-mono text-primary text-xs">
                        <span>cloud.shiftpayhr.com</span>
                        <button
                          type="button"
                          onClick={() => handleCopy("cloud.shiftpayhr.com", "srv_addr")}
                          className="hover:underline font-bold text-[11px]"
                        >
                          {copiedKey === "srv_addr" ? "تم" : "نسخ"}
                        </button>
                      </div>
                    </li>
                    <li>
                      في خانة <span className="font-black text-ink">منفذ الخادم (Server Port)</span> اكتب: <span className="font-mono text-ink font-black">443</span> (أو <span className="font-mono text-ink font-black">80</span> إذا كان بروتوكول HTTP).
                    </li>
                    <li>
                      احفظ الإعدادات وأعد تشغيل الجهاز. بمجرد اتصاله بالإنترنت، ستظهر أيقونة السحابة (Globe/Cloud) في أعلى الشاشة بلون أخضر وسيبدأ إرسال الحضور فوراً!
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-amber-900">
                    <p className="font-black text-sm mb-1">طريقة ربط ماكينات الشبكة المحلية (LAN Bridge):</p>
                    <p className="text-xs text-amber-800">
                      للأجهزة التي تعمل عبر كابل الشبكة بدون ميزة السيرفر السحابي (ADMS).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p>
                      1. تأكد من توصيل الماكينة بالراوتر بكابل شبكة وتثبيت IP محلي لها (مثل <span className="font-mono text-ink">{selectedGuideDevice.ipAddress}</span>).
                    </p>
                    <p>
                      2. حمّل سكربت المزامنة الخفيف بالضغط على الزر أدناه وشغله على أي جهاز كمبيوتر متصل بنفس الراوتر:
                    </p>
                    <button
                      type="button"
                      onClick={() => downloadPythonScript(selectedGuideDevice)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
                    >
                      <Download size={14} />
                      تحميل سكربت المزامنة (Python Script)
                    </button>
                    <p className="text-[11px] text-slate-500">
                      يعمل السكربت في الخلفية ويسحب البصمات كل 60 ثانية ويرسلها لمشروعك تلقائياً باستخدام مفتاح الأمان المرفق.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setSelectedGuideDevice(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
