export type ExpiryStatus = "expired" | "critical" | "expiring_soon" | "valid";

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
}

/**
 * Status thresholds:
 *  - expired: days < 0
 *  - critical: 0-7 days
 *  - expiring_soon: 8-warningDays
 *  - valid: > warningDays
 */
export function getExpiryStatus(expiryDate: string, warningDays = 30): ExpiryStatus {
  const days = daysRemaining(expiryDate);
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= warningDays) return "expiring_soon";
  return "valid";
}

export function getWarningDays(): number {
  const envVal = parseInt(process.env.EXPIRY_WARNING_DAYS || "30", 10);
  return Number.isFinite(envVal) && envVal > 0 ? envVal : 30;
}
