import React, { useEffect, useState } from "react";
import { KeyRound, Camera } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    api.get("/users/profile").then((res) => setProfile(res.data.user));
  }, []);

  const handlePictureChange = async (file: File | null) => {
    if (!file) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append("picture", file);
      const res = await api.post("/users/profile/picture", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile((p: any) => ({ ...p, profilePicture: res.data.profilePicture }));
      await refresh();
      showToast("Profile picture updated.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = "Current password is required.";
    if (newPassword.length < 8) errs.newPassword = "New password must be at least 8 characters.";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword, confirmPassword });
      showToast("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="font-display text-2xl font-semibold text-navy-950">My Profile</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-6 text-center lg:col-span-1">
          <div className="relative mx-auto w-fit">
            {profile?.profilePicture ? (
              <img src={`/${profile.profilePicture}`} className="h-24 w-24 rounded-full object-cover" alt="" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy-900 text-2xl font-semibold text-white">
                {user?.fullName?.slice(0, 1)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-navy-900 text-white hover:bg-navy-800">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePictureChange(e.target.files?.[0] || null)} />
            </label>
          </div>
          {uploadingPic && <p className="mt-2 text-xs text-gray-400">Uploading…</p>}
          <h2 className="mt-4 font-display text-lg font-semibold text-navy-950">{user?.fullName}</h2>
          <p className="text-sm text-gray-500">{user?.serviceNumber}</p>
          <span className="mt-2 inline-block rounded-full bg-navy-50 px-3 py-1 text-xs font-medium capitalize text-navy-700">
            {user?.role}
          </span>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound size={17} className="text-navy-900" />
            <h2 className="font-display text-lg font-semibold text-navy-950">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              />
              {pwErrors.currentPassword && <p className="mt-1 text-xs text-red-600">{pwErrors.currentPassword}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              />
              {pwErrors.newPassword && <p className="mt-1 text-xs text-red-600">{pwErrors.newPassword}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              />
              {pwErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{pwErrors.confirmPassword}</p>}
            </div>
            <button
              type="submit"
              disabled={savingPw}
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
