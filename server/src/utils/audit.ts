import supabase from "../db/supabase";
import { AuthUser } from "../types";

export async function logAudit(params: {
  user: AuthUser;
  action: string;
  recordType?: "vehicle" | "vessel" | "user" | "category";
  recordId?: string;
  recordLabel?: string;
  changes?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("audit_log").insert({
    user_id: params.user.id,
    user_name: params.user.fullName,
    service_number: params.user.serviceNumber,
    action: params.action,
    record_type: params.recordType || null,
    record_id: params.recordId || null,
    record_label: params.recordLabel || null,
    changes: params.changes || null,
  });
  if (error) console.error("Failed to write audit log:", error.message);
}
