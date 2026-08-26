import { Request, Response } from "express";
import supabase from "../db/supabase";

export async function listAuditLog(req: Request, res: Response) {
  const { page = "1", pageSize = "50", recordType = "", search = "" } = req.query as Record<string, string>;

  const { data: allRows, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  let rows = allRows || [];

  if (recordType) rows = rows.filter((r) => r.record_type === recordType);
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.user_name.toLowerCase().includes(s) ||
        r.service_number.toLowerCase().includes(s) ||
        (r.record_label || "").toLowerCase().includes(s) ||
        r.action.toLowerCase().includes(s)
    );
  }

  const total = rows.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 50);
  const paged = rows.slice((p - 1) * ps, p * ps);

  res.json({
    items: paged.map((r) => ({
      id: r.id,
      userName: r.user_name,
      serviceNumber: r.service_number,
      action: r.action,
      recordType: r.record_type,
      recordId: r.record_id,
      recordLabel: r.record_label,
      changes: r.changes,
      createdAt: r.created_at,
    })),
    total,
    page: p,
    pageSize: ps,
  });
}
