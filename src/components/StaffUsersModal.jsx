import React, { useState } from "react";
import {
  X,
  Users,
  UserCheck,
  Shield,
  Key,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Copy,
  Share2,
  Building2,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { RBAC_ROLES } from "../App";

export default function StaffUsersModal({
  isOpen,
  onClose,
  staffUsers = [],
  onSaveStaffUsers,
  employees = [],
  onUpdateEmployeePin,
  departments = [],
  settings = {},
  lang = "ar"
}) {
  const companyCode = (settings.companyCode || "MASAR").toUpperCase();
  const companyName = settings.companyName || "شركة المسار الذكي";
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?c=${companyCode}#portal`
    : `https://shiftpayhr.com/?c=${companyCode}#portal`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmpId, setCopiedEmpId] = useState(null);

  const [activeTab, setActiveTab] = useState("staff"); // "staff" | "employees_pins"
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Form state for new/edited staff user
  const [editingUserId, setEditingUserId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("hr_director");
  const [formDept, setFormDept] = useState("");

  // Employee PIN edit state
  const [pinEditEmpId, setPinEditEmpId] = useState(null);
  const [newPinValue, setNewPinValue] = useState("");

  const isEn = lang === "en";

  if (!isOpen) return null;

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("hr_director");
    setFormDept("");
    setShowAddUserModal(true);
  };

  const handleEditUser = (usr) => {
    setEditingUserId(usr.id);
    setFormName(usr.name || "");
    setFormUsername(usr.username || "");
    setFormEmail(usr.email || "");
    setFormPassword(usr.password || "");
    setFormRole(usr.role || "hr_director");
    setFormDept(usr.departmentId || "");
    setShowAddUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formUsername || !formPassword) return;

    let updatedList;
    if (editingUserId) {
      updatedList = staffUsers.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              name: formName || formUsername,
              username: formUsername.trim(),
              email: formEmail.trim(),
              password: formPassword.trim(),
              role: formRole,
              departmentId: formDept
            }
          : u
      );
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        name: formName || formUsername,
        username: formUsername.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        departmentId: formDept,
        active: true,
        lastLogin: isEn ? "Never" : "لم يسجل بعد"
      };
      updatedList = [...staffUsers, newUser];
    }

    onSaveStaffUsers(updatedList);
    setShowAddUserModal(false);
  };

  const handleDeleteUser = (id) => {
    if (staffUsers.length <= 1) return;
    const updated = staffUsers.filter((u) => u.id !== id);
    onSaveStaffUsers(updated);
  };

  const handleToggleUserActive = (id) => {
    const updated = staffUsers.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
    onSaveStaffUsers(updated);
  };

  const handleSavePin = (empId) => {
    if (onUpdateEmployeePin && newPinValue) {
      onUpdateEmployeePin(empId, newPinValue.trim());
      setPinEditEmpId(null);
      setNewPinValue("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
              <Shield size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink dark:text-white">
                {isEn ? "System Users & Access Credentials" : "إدارة مستخدمي النظام وكلمات المرور"}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn
                  ? "Configure administrative staff login accounts and employee self-service portal PINs"
                  : "إنشاء وتعيين حسابات الدخول لمسؤولي النظام والمحاسبين، وضبط أرقام سرية بوابة الموظفين"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-line dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`py-3 text-xs font-black border-b-2 transition flex items-center gap-2 ${
                activeTab === "staff"
                  ? "border-primary text-primary dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserCheck size={15} />
              <span>{isEn ? "Administrative Staff Accounts" : "حسابات الإدارة والصلاحيات"}</span>
              <span className="rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.2">
                {staffUsers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("employees_pins")}
              className={`py-3 text-xs font-black border-b-2 transition flex items-center gap-2 ${
                activeTab === "employees_pins"
                  ? "border-primary text-primary dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Key size={15} />
              <span>{isEn ? "Employee Portal PINs & Passwords" : "كلمات مرور بوابة الموظفين"}</span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 text-primary dark:text-blue-300 text-[10px] px-2 py-0.2">
                {employees.length}
              </span>
            </button>
          </div>

          {activeTab === "staff" && (
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-2xs"
            >
              <Plus size={14} />
              <span>{isEn ? "Add Staff User" : "إضافة مستخدم"}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "staff" && (
            <div className="space-y-3">
              {staffUsers.map((usr) => {
                const roleDef = RBAC_ROLES.find((r) => r.id === usr.role) || RBAC_ROLES[0];
                const showPw = Boolean(showPasswordMap[usr.id]);

                return (
                  <div
                    key={usr.id}
                    className="rounded-xl border border-line dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-ink dark:text-white">
                          {usr.name}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${roleDef.badge}`}>
                          {isEn ? roleDef.labelEn : roleDef.labelAr}
                        </span>
                        {!usr.active && (
                          <span className="rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-black">
                            {isEn ? "Inactive" : "معطل"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-bold">
                        <span>
                          {isEn ? "Username" : "اسم المستخدم"}: <strong className="text-ink dark:text-slate-200">{usr.username}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {isEn ? "Password" : "كلمة السر"}:{" "}
                          <strong className="text-ink dark:text-slate-200">
                            {showPw ? usr.password : "••••••"}
                          </strong>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswordMap({ ...showPasswordMap, [usr.id]: !showPw })
                            }
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </span>
                        {usr.email && (
                          <>
                            <span>•</span>
                            <span>{usr.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleEditUser(usr)}
                        className="rounded-lg border border-line dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition shadow-2xs"
                        title={isEn ? "Edit" : "تعديل"}
                      >
                        <Edit2 size={14} />
                      </button>
                      {staffUsers.length > 1 && usr.username !== "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(usr.id)}
                          className="rounded-lg border border-rose-200 dark:border-rose-900/60 p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition shadow-2xs"
                          title={isEn ? "Delete" : "حذف"}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "employees_pins" && (
            <div className="space-y-3">
              {/* Company Portal Direct Link Banner */}
              <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/40 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-purple-600" />
                    <span className="font-black text-ink dark:text-white text-xs">
                      {isEn ? "Company Portal Link & Code" : "رابط وكود بوابة الموظفين لشركتك"}:
                    </span>
                    <span className="rounded-md bg-purple-600 text-white px-2 py-0.5 font-mono font-black text-xs">
                      {companyCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(portalUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 px-3 py-1.5 text-xs font-black text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>{copiedLink ? (isEn ? "Copied ✓" : "تم نسخ الرابط ✓") : (isEn ? "Copy Direct Link" : "نسخ الرابط المباشر")}</span>
                    </button>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1.5 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-200 transition"
                      title={isEn ? "Open portal in new tab" : "فتح البوابة في تبويب جديد"}
                    >
                      <ExternalLink size={13} />
                      <span>{isEn ? "Test Link" : "تجربة"}</span>
                    </a>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isEn
                    ? `Share this link with your employees. Opening it automatically binds them to company "${companyName}" (${companyCode}) so they only need their Employee Code and PIN.`
                    : `أرسل هذا الرابط لموظفيك عبر واتساب أو البريد. عند فتحه يربط هاتف الموظف تلقائياً بشركة "${companyName}" (كود: ${companyCode}) ويمنع أي تداخل مع أي شركة أخرى.`}
                </p>
              </div>

              <div className="divide-y divide-line dark:divide-slate-800 rounded-xl border border-line dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {employees.map((emp) => {
                  const currentPin = emp.portalPassword || "1234";
                  const isEditing = pinEditEmpId === emp.id;

                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-ink dark:text-white font-black text-xs font-mono">
                          {emp.code}
                        </div>
                        <div>
                          <span className="font-black text-ink dark:text-white block">
                            {emp.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {emp.jobTitle || "موظف"} • كود: {emp.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newPinValue}
                              onChange={(e) => setNewPinValue(e.target.value)}
                              placeholder="PIN جديد"
                              className="w-28 rounded-lg border border-primary px-2.5 py-1 text-xs font-black text-ink dark:text-white focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePin(emp.id)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 shadow-2xs"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => setPinEditEmpId(null)}
                              className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-slate-500"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-slate-500 dark:text-slate-400 font-bold">
                              {isEn ? "PIN" : "الـ PIN"}:{" "}
                              <code className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono font-black text-ink dark:text-white">
                                {currentPin}
                              </code>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPinEditEmpId(emp.id);
                                setNewPinValue(currentPin);
                              }}
                              className="rounded-lg border border-line dark:border-slate-700 px-2.5 py-1 text-[11px] font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                            >
                              {isEn ? "Reset PIN" : "تعديل الـ PIN"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const msg = isEn
                                  ? `Hello ${emp.name},\nHere are your ShiftPay HR Self-Service Portal login credentials:\n• Company: ${companyName} (Code: ${companyCode})\n• Employee Code: ${emp.code}\n• Portal PIN: ${currentPin}\n• Direct Link: ${portalUrl}`
                                  : `مرحباً ${emp.name}،\nبيانات دخولك لبوابة الخدمة الذاتية للموظفين (ShiftPay HR):\n• الشركة: ${companyName} (كود: ${companyCode})\n• كود الموظف: ${emp.code}\n• كلمة المرور (PIN): ${currentPin}\n• رابط الدخول المباشر: ${portalUrl}\nيرجى الحفاظ على سرية بياناتك.`;
                                navigator.clipboard?.writeText(msg);
                                setCopiedEmpId(emp.id);
                                setTimeout(() => setCopiedEmpId(null), 2500);
                              }}
                              className="flex items-center gap-1 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-[11px] font-black text-primary dark:text-blue-300 hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                              title={isEn ? "Copy WhatsApp credentials message" : "نسخ رسالة بيانات الدخول للموظف"}
                            >
                              <Share2 size={12} />
                              <span>{copiedEmpId === emp.id ? (isEn ? "Copied ✓" : "تم النسخ ✓") : (isEn ? "Share Card" : "مشاركة الدخول")}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>ShiftPay HR • Enterprise Identity & Access Management</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-black"
          >
            {isEn ? "Close" : "إغلاق"}
          </button>
        </div>
      </div>

      {/* Add / Edit Staff User Sub-Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-ink dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-purple-600" />
              <span>
                {editingUserId
                  ? (isEn ? "Edit Staff User" : "تعديل بيانات المستخدم")
                  : (isEn ? "Create New Staff User" : "إنشاء مستخدم نظام جديد")}
              </span>
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {isEn ? "Full Name" : "الاسم الكامل للمستخدم"}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أ/ محمد سامي"
                  className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isEn ? "Username (Login)" : "اسم المستخدم (Username)"}
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="m.sami"
                    className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isEn ? "Password" : "كلمة المرور (Password)"}
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {isEn ? "Assigned Role (Permissions)" : "الصلاحية الوظيفية (Role)"}
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden focus:border-primary"
                >
                  {RBAC_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {isEn ? r.labelEn : r.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {formRole === "dept_manager" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isEn ? "Managed Department" : "القسم المسؤول عنه"}
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden"
                  >
                    <option value="">{isEn ? "Select Department" : "اختر القسم"}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {isEn ? "Email (Optional)" : "البريد الإلكتروني (اختياري)"}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="m.sami@company.com"
                  className="w-full rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-ink dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl border border-line px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  {isEn ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-black text-white hover:bg-blue-700 shadow-xs"
                >
                  {isEn ? "Save User" : "حفظ المستخدم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
