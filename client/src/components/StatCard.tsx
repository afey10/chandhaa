import React from "react";

export default function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  const toneMap = {
    default: "text-navy-900 bg-navy-950",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-red-700 bg-red-50",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono-reg uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone === "default" ? "bg-navy-950 text-gold-400" : toneMap[tone]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-navy-950">{value}</div>
    </div>
  );
}
