import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Wallet, ShieldAlert, Wrench, ChevronRight } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import ReminderButton from "../../components/ReminderButton";
import * as rpc from "../../api/rpc";
import { getErrorMessage } from "../../api/rpc";
import { daysRemaining, formatDate } from "../../utils/date";
import { useToast } from "../../components/Toast";

const TABS = [
  { key: "annualFee", label: "Annual Fee Expiring Soon", dateField: "annualFeeExpiry", statusField: "annualFee" },
  { key: "insurance", label: "Insurance Expiring Soon", dateField: "insuranceExpiry", statusField: "insurance" },
  { key: "roadworthiness", label: "Roadworthiness Expiring Soon", dateField: "roadworthinessExpiry", statusField: "roadworthiness" },
] as const;

export default function VehicleDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("insurance");
  const [items, setItems] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    rpc.getVehicleDashboard().then(setData).catch((err) => showToast(getErrorMessage(err), "error"));
  }, []);

  useEffect(() => {
    setLoadingList(true);
    rpc
      .getVehiclesExpiring(activeTab)
      .then((res) => setItems(res.items))
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoadingList(false));
  }, [activeTab]);

  const tabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">Vehicle Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of all registered vehicles at Tha. Veymandoo.</p>
        </div>
        <Link to="/vehicles/new" className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
          + Add Vehicle
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Vehicles" value={data?.totalVehicles ?? "—"} icon={<Car size={18} />} />
        <StatCard label="Annual Fee Expiring" value={data?.annualFeeExpiringSoon ?? "—"} icon={<Wallet size={18} />} tone="warning" />
        <StatCard label="Insurance Expiring" value={data?.insuranceExpiringSoon ?? "—"} icon={<ShieldAlert size={18} />} tone="warning" />
        <StatCard label="Roadworthiness Expiring" value={data?.roadworthinessExpiringSoon ?? "—"} icon={<Wrench size={18} />} tone="warning" />
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
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#e5e8f0] text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Registration Number</th>
                <th className="px-4 py-3">Owner Name</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loadingList && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No vehicles are currently in this expiry window.</td></tr>
              )}
              {!loadingList &&
                items.map((v) => {
                  const expiry = (v as any)[tabConfig.dateField];
                  const status = (v.status as any)[tabConfig.statusField];
                  return (
                    <tr key={v.id} className="border-b border-[#f0f1f5] hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono-reg font-medium text-navy-900">{v.registrationNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{v.ownerFullName}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(expiry)}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} daysRemaining={daysRemaining(expiry)} /></td>
                      <td className="px-4 py-3">
                        <ReminderButton type="vehicle" registrationNumber={v.registrationNumber} contactNumber={v.contactNumber} status={v.status} compact />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/vehicles/${v.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline">
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
            <div className="px-4 py-8 text-center text-gray-400">No vehicles are currently in this expiry window.</div>
          )}
          {!loadingList &&
            items.map((v) => {
              const expiry = (v as any)[tabConfig.dateField];
              const status = (v.status as any)[tabConfig.statusField];
              return (
                <div key={v.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <Link to={`/vehicles/${v.id}`} className="min-w-0 flex-1">
                    <div className="font-mono-reg font-medium text-navy-900">{v.registrationNumber}</div>
                    <div className="text-xs text-gray-500">{v.ownerFullName} · {formatDate(expiry)}</div>
                  </Link>
                  <ReminderButton type="vehicle" registrationNumber={v.registrationNumber} contactNumber={v.contactNumber} status={v.status} compact />
                  <StatusBadge status={status} daysRemaining={daysRemaining(expiry)} />
                </div>
              );
            })}
        </div>
      </div>
    </AppLayout>
  );
}
