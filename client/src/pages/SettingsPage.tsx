import React, { useEffect, useState } from "react";
import { UserPlus, KeyRound } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../components/Toast";

interface UserRow {
  id: string;
  serviceNumber: string;
  fullName: string;
  role: "admin" | "staff";
  canAddRecords: boolean;
  canEditRecords: boolean;
  isActive: boolean;
}

const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  const [newUser, setNewUser] = useState({ serviceNumber: "", fullName: "", password: "", role: "staff" as "admin" | "staff", canAddRecords: false, canEditRecords: false });
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/users")
      .then((res) => setUsers(res.data.items))
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", newUser);
      showToast(`User account for ${newUser.fullName} created.`);
      setNewUser({ serviceNumber: "", fullName: "", password: "", role: "staff", canAddRecords: false, canEditRecords: false });
      setShowAddUser(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handlePermissionToggle = async (u: UserRow, field: "canAddRecords" | "canEditRecords" | "isActive") => {
    try {
      await api.put(`/users/${u.id}/permissions`, { [field]: !u[field] });
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (resetPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { newPassword: resetPassword });
      showToast(`Password for ${resetTarget.fullName} has been reset.`);
      setResetTarget(null);
      setResetPassword("");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <AppLayout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage staff accounts, roles and permissions.</p>
        </div>
        <button
          onClick={() => setShowAddUser((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <UserPlus size={15} /> Add Staff Account
        </button>
      </div>

      {showAddUser && (
        <form onSubmit={handleCreateUser} className="card mb-5 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service Number</label>
            <input required value={newUser.serviceNumber} onChange={(e) => setNewUser({ ...newUser, serviceNumber: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input required value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
            <input required type="text" minLength={8} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "staff" })} className={inputClass}>
              <option value="staff">Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {newUser.role === "staff" && (
            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={newUser.canAddRecords} onChange={(e) => setNewUser({ ...newUser, canAddRecords: e.target.checked })} />
                Can add records
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={newUser.canEditRecords} onChange={(e) => setNewUser({ ...newUser, canEditRecords: e.target.checked })} />
                Can edit records
              </label>
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              Create Account
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-[#e5e8f0] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Service No.</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Add</th>
              <th className="px-4 py-3">Edit</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-[#f0f1f5]">
                  <td className="px-4 py-3 font-medium text-navy-950">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono-reg text-gray-600">{u.serviceNumber}</td>
                  <td className="px-4 py-3 capitalize text-gray-700">{u.role}</td>
                  <td className="px-4 py-3">
                    <input type="checkbox" disabled={u.role === "admin"} checked={u.canAddRecords || u.role === "admin"} onChange={() => handlePermissionToggle(u, "canAddRecords")} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" disabled={u.role === "admin"} checked={u.canEditRecords || u.role === "admin"} onChange={() => handlePermissionToggle(u, "canEditRecords")} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={u.isActive} onChange={() => handlePermissionToggle(u, "isActive")} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setResetTarget(u)} className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline">
                      <KeyRound size={14} /> Reset Password
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleResetPassword} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-navy-950">Reset password</h3>
            <p className="mt-1 text-sm text-gray-600">Set a new temporary password for {resetTarget.fullName}.</p>
            <input
              type="text"
              minLength={8}
              required
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className={`${inputClass} mt-4`}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetPassword("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
