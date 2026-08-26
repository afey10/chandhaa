import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [serviceNumber, setServiceNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!loading && user) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!serviceNumber.trim() || !password) {
      setError("Please enter both your service number and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(serviceNumber.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <div className="hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="seal flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldCheck size={22} className="text-gold-400" />
          </div>
          <div className="font-display text-lg font-semibold text-white">Maldives Police Service</div>
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white">
            Tha. Veymandoo
            <br />
            Police Station
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Vehicles &amp; Vessels Dhaftharu — the digital registry of record for every vehicle and vessel
            registered on this island, maintained for authorised station staff.
          </p>
        </div>
        <div className="text-xs font-mono-reg text-white/30">RESTRICTED · INTERNAL USE ONLY</div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#f6f7fb] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="seal flex h-14 w-14 items-center justify-center rounded-full">
              <ShieldCheck size={24} className="text-gold-400" />
            </div>
            <h1 className="text-center font-display text-xl font-semibold text-navy-950">
              Tha. Veymandoo Police Station
              <br />
              Vehicles &amp; Vessels Dhaftharu
            </h1>
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-navy-950">Staff Sign In</h2>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to access the Dhaftharu.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Service Number</label>
                <input
                  type="text"
                  value={serviceNumber}
                  onChange={(e) => setServiceNumber(e.target.value)}
                  placeholder="e.g. V1001"
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
              >
                <Lock size={15} />
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Access is limited to authorised Tha. Veymandoo Police Station personnel.
          </p>
        </div>
      </div>
    </div>
  );
}
