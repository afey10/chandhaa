import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, BookUser, Briefcase, ChevronRight } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl } from "../../api/rpc";
import { daysRemaining, formatDate } from "../../utils/date";
import { useToast } from "../../components/Toast";

const TABS = [
  { key: "passport", label: "Expiring Passports", dateField: "passportExpiryDate", statusField: "passport" },
  { key: "visa", label: "Expiring Work Visas", dateField: "workVisaExpiryDate", statusField: "visa" },
] as const;

export default function ForeignerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("passport");
  const [items, setItems] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    rpc.getForeignerDashboard().then(setData).catch((err) => showToast(getErrorMessage(err), "error"));
  }, []);

  useEffect(() => {
    setLoadingList(true);
    rpc
      .getForeignersExpiring(activeTab)
      .then((res) => setItems(res.items))
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoadingList(false));
  }, [activeTab]);

  const tabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">Bidheyseenge Dhaftharu Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of all registered foreigners at Tha. Veymandoo.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/bidheyseenge/foreigners" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            View Foreigner List
          </Link>
          <Link to="/bidheyseenge/foreigners/add" className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
            + Add Foreigner
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Foreigners" value={data?.totalForeigners ?? "—"} icon={<Users size={18} />} />
        <StatCard label="Expiring Passports" value={data?.expiringPassports ?? "—"} icon={<BookUser size={18} />} tone="warning" />
        <StatCard label="Expiring Visas" value={data?.expiringVisas ?? "—"} icon={<Briefcase size={18} />} tone="warning" />
      </div>

      <div className="card mt-6">
        <div className="flex flex-wrap gap-1 border-b border-[#e5e8f0] p-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === t.key ? "bg-navy-950 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#e5e8f0] text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Passport Number</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loadingList && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {activeTab === "passport" ? "No passports expiring within the warning period." : "No work visas expiring within the warning period."}
                  </td>
                </tr>
              )}
              {!loadingList &&
                items.map((f) => {
                  const expiry = (f as any)[tabConfig.dateField];
                  const status = (f.status as any)[tabConfig.statusField];
                  return (
                    <tr key={f.id} className="border-b border-[#f0f1f5] hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {f.photoUrl ? (
                          <img src={publicFileUrl(f.photoUrl) || ""} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                            {f.fullName?.slice(0, 1)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-900">{f.fullName}</td>
                      <td className="px-4 py-3 font-mono-reg text-gray-700">{f.passportNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{f.country}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(expiry)}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} daysRemaining={daysRemaining(expiry)} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/bidheyseenge/foreigners/${f.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline">
                          View <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-[#f0f1f5] sm:hidden">
          {loadingList && <div className="px-4 py-6 text-center text-gray-400">Loading…</div>}
          {!loadingList && items.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400">
              {activeTab === "passport" ? "No passports expiring within the warning period." : "No work visas expiring within the warning period."}
            </div>
          )}
          {!loadingList &&
            items.map((f) => {
              const expiry = (f as any)[tabConfig.dateField];
              const status = (f.status as any)[tabConfig.statusField];
              return (
                <Link key={f.id} to={`/bidheyseenge/foreigners/${f.id}`} className="flex items-center gap-3 px-4 py-3">
                  {f.photoUrl ? (
                    <img src={publicFileUrl(f.photoUrl) || ""} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                      {f.fullName?.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-navy-900">{f.fullName}</div>
                    <div className="truncate text-xs text-gray-500">{f.passportNumber} · {f.country}</div>
                  </div>
                  <StatusBadge status={status} daysRemaining={daysRemaining(expiry)} />
                </Link>
              );
            })}
        </div>
      </div>
    </AppLayout>
  );
}
