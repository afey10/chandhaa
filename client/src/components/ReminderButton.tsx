import React from "react";
import { MessageCircle } from "lucide-react";
import { useToast } from "./Toast";
import { RecordStatus } from "../types";

interface ReminderButtonProps {
  type: "vehicle" | "vessel";
  registrationNumber: string;
  contactNumber?: string | null;
  status: RecordStatus;
  className?: string;
  compact?: boolean;
}

const LABELS: Record<keyof RecordStatus, string> = {
  annualFee: "annual fee",
  insurance: "insurance",
  roadworthiness: "roadworthiness certificate",
};

export function isAnyExpiring(status: RecordStatus): boolean {
  return status.annualFee !== "valid" || status.insurance !== "valid" || status.roadworthiness !== "valid";
}

function buildReminderMessage(type: "vehicle" | "vessel", registrationNumber: string, status: RecordStatus): string {
  const keys = (Object.keys(LABELS) as (keyof RecordStatus)[]).filter((k) => status[k] !== "valid");
  const items = keys.map((k) => LABELS[k]);
  const itemsText = items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];
  const verb = items.length > 1 ? "are" : "is";

  return (
    `Dear Sir/Madam, This is a gentle reminder about the ${type} fees that are expiring. ` +
    `Your ${type} with registration number ${registrationNumber} has ${itemsText} that ${verb} due for renewal soon. ` +
    `Please renew at your earliest convenience to avoid any inconvenience. ` +
    `Thank you. - Tha. Veymandoo Police Station`
  );
}

function buildSmsHref(contactNumber: string, message: string): string {
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "&" : "?";
  return `sms:${contactNumber}${separator}body=${encodeURIComponent(message)}`;
}

export default function ReminderButton({ type, registrationNumber, contactNumber, status, className, compact }: ReminderButtonProps) {
  const { showToast } = useToast();

  if (!isAnyExpiring(status)) return null;

  if (!contactNumber) {
    return (
      <button
        type="button"
        onClick={() => showToast("No contact number on file for this owner.", "error")}
        className={
          className ||
          `flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 opacity-60 ${
            compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
          } font-medium`
        }
      >
        <MessageCircle size={compact ? 13 : 15} /> {compact ? "Remind" : "Remind Owner"}
      </button>
    );
  }

  const href = buildSmsHref(contactNumber, buildReminderMessage(type, registrationNumber, status));

  return (
    <a
      href={href}
      className={
        className ||
        `flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
        } font-medium`
      }
    >
      <MessageCircle size={compact ? 13 : 15} /> {compact ? "Remind" : "Remind Owner"}
    </a>
  );
}
