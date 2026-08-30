import React from "react";
import { ExpiryStatus } from "../types";

const CONFIG: Record<ExpiryStatus, { label: string; color: string; bg: string }> = {
  valid: { label: "Valid", color: "#166534", bg: "#ECFDF3" },
  expiring_soon: { label: "Expiring Soon", color: "#92610A", bg: "#FFFAEB" },
  critical: { label: "Critical", color: "#B54708", bg: "#FFF6ED" },
  expired: { label: "Expired", color: "#B42318", bg: "#FEF3F2" },
};

export default function StatusBadge({ status, daysRemaining }: { status: ExpiryStatus; daysRemaining?: number }) {
  const cfg = CONFIG[status];
  return (
    <span className="status-stamp" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: cfg.color,
          display: "inline-block",
        }}
      />
      {cfg.label}
      {typeof daysRemaining === "number" && status !== "expired" ? ` · ${daysRemaining}d` : null}
      {typeof daysRemaining === "number" && status === "expired" ? ` · ${Math.abs(daysRemaining)}d ago` : null}
    </span>
  );
}
