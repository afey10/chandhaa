import { Request, Response } from "express";
import supabase from "../db/supabase";
import { vesselSchema } from "../utils/validation";
import { getExpiryStatus, getWarningDays } from "../utils/expiry";
import { logAudit } from "../utils/audit";

const SELECT_WITH_CATEGORY = "*, vessel_categories(name)";

function enrich(row: any, warningDays: number) {
  return {
    id: row.id,
    registrationNumber: row.registration_number,
    categoryId: row.category_id,
    categoryName: row.vessel_categories?.name || row.category_name,
    vesselName: row.vessel_name,
    builder: row.builder,
    model: row.model,
    year: row.year,
    colour: row.colour,
    engineNumber: row.engine_number,
    hullNumber: row.hull_number,
    length: row.length,
    width: row.width,
    ownerFullName: row.owner_full_name,
    ownerIdCard: row.owner_id_card,
    ownerAddress: row.owner_address,
    contactNumber: row.contact_number,
    annualFeeExpiry: row.annual_fee_expiry,
    insuranceExpiry: row.insurance_expiry,
    roadworthinessExpiry: row.roadworthiness_expiry,
    photograph: row.photograph,
    remarks: row.remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: {
      annualFee: getExpiryStatus(row.annual_fee_expiry, warningDays),
      insurance: getExpiryStatus(row.insurance_expiry, warningDays),
      roadworthiness: getExpiryStatus(row.roadworthiness_expiry, warningDays),
    },
  };
}

function worstStatus(row: any, warningDays: number): string {
  const order = ["expired", "critical", "expiring_soon", "valid"];
  const statuses = [
    getExpiryStatus(row.annual_fee_expiry, warningDays),
    getExpiryStatus(row.insurance_expiry, warningDays),
    getExpiryStatus(row.roadworthiness_expiry, warningDays),
  ];
  statuses.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return statuses[0];
}

function collapse(status: string): string {
  if (status === "critical") return "expiring_soon";
  return status;
}

export async function getDashboard(_req: Request, res: Response) {
  const warningDays = getWarningDays();

  const { count: total } = await supabase.from("vessels").select("*", { count: "exact", head: true });
  const { data: rows, error } = await supabase.from("vessels").select("annual_fee_expiry, insurance_expiry, roadworthiness_expiry");
  if (error) throw error;

  let annualFeeSoon = 0,
    insuranceSoon = 0,
    roadworthinessSoon = 0;

  for (const r of rows || []) {
    const af = getExpiryStatus(r.annual_fee_expiry, warningDays);
    const ins = getExpiryStatus(r.insurance_expiry, warningDays);
    const rw = getExpiryStatus(r.roadworthiness_expiry, warningDays);
    if (af === "critical" || af === "expiring_soon") annualFeeSoon++;
    if (ins === "critical" || ins === "expiring_soon") insuranceSoon++;
    if (rw === "critical" || rw === "expiring_soon") roadworthinessSoon++;
  }

  const { data: categories } = await supabase.from("vessel_categories").select("id, name");
  const byCategory = [];
  for (const c of categories || []) {
    const { count } = await supabase.from("vessels").select("*", { count: "exact", head: true }).eq("category_id", c.id);
    byCategory.push({ category: c.name, count: count || 0 });
  }
  byCategory.sort((a, b) => b.count - a.count);

  res.json({
    totalVessels: total || 0,
    annualFeeExpiringSoon: annualFeeSoon,
    insuranceExpiringSoon: insuranceSoon,
    roadworthinessExpiringSoon: roadworthinessSoon,
    warningDays,
    byCategory,
  });
}

export async function getExpiringList(req: Request, res: Response) {
  const warningDays = getWarningDays();
  const type = (req.query.type as string) || "insurance";
  const columnMap: Record<string, string> = {
    annualFee: "annual_fee_expiry",
    insurance: "insurance_expiry",
    roadworthiness: "roadworthiness_expiry",
  };
  const column = columnMap[type] || "insurance_expiry";

  const { data: rows, error } = await supabase.from("vessels").select(SELECT_WITH_CATEGORY).order(column, { ascending: true });
  if (error) throw error;

  const filtered = (rows || [])
    .map((r: any) => enrich(r, warningDays))
    .filter((r: any) => {
      const status = type === "annualFee" ? r.status.annualFee : type === "roadworthiness" ? r.status.roadworthiness : r.status.insurance;
      return status === "critical" || status === "expiring_soon" || status === "expired";
    });

  res.json({ items: filtered });
}

export async function list(req: Request, res: Response) {
  const warningDays = getWarningDays();
  const {
    search = "",
    category = "",
    overallStatus = "",
    sortBy = "registration_number",
    sortDir = "asc",
    page = "1",
    pageSize = "20",
  } = req.query as Record<string, string>;

  const { data: allRows, error } = await supabase.from("vessels").select(SELECT_WITH_CATEGORY);
  if (error) throw error;

  let rows = (allRows || []) as any[];

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.registration_number.toLowerCase().includes(s) ||
        r.owner_full_name.toLowerCase().includes(s) ||
        r.owner_id_card.toLowerCase().includes(s)
    );
  }
  if (category) rows = rows.filter((r) => r.category_id === category);
  if (overallStatus) rows = rows.filter((r) => collapse(worstStatus(r, warningDays)) === overallStatus);

  const sortMap: Record<string, (r: any) => string> = {
    registration_number: (r) => r.registration_number,
    owner_name: (r) => r.owner_full_name,
    expiry_date: (r) => r.insurance_expiry,
    category: (r) => r.vessel_categories?.name || "",
  };
  const sortFn = sortMap[sortBy] || sortMap.registration_number;
  rows.sort((a, b) => {
    const av = (sortFn(a) || "").toString().toLowerCase();
    const bv = (sortFn(b) || "").toString().toLowerCase();
    if (av < bv) return sortDir === "desc" ? 1 : -1;
    if (av > bv) return sortDir === "desc" ? -1 : 1;
    return 0;
  });

  const totalMatching = rows.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 20);
  const paged = rows.slice((p - 1) * ps, p * ps);

  const { count: totalAll } = await supabase.from("vessels").select("*", { count: "exact", head: true });

  res.json({
    items: paged.map((r) => enrich(r, warningDays)),
    total: totalMatching,
    totalAll: totalAll || 0,
    page: p,
    pageSize: ps,
  });
}

export async function getById(req: Request, res: Response) {
  const warningDays = getWarningDays();
  const { data: row, error } = await supabase.from("vessels").select(SELECT_WITH_CATEGORY).eq("id", req.params.id).maybeSingle();
  if (error) throw error;
  if (!row) return res.status(404).json({ error: "Vessel not found." });

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("record_type", "vessel")
    .eq("record_id", row.id);

  res.json({ vessel: enrich(row, warningDays), documents: documents || [] });
}

export async function create(req: Request, res: Response) {
  const data = vesselSchema.parse(req.body);
  const photograph = (req.file as Express.Multer.File | undefined)?.path || null;

  const { data: inserted, error } = await supabase
    .from("vessels")
    .insert({
      registration_number: data.registrationNumber,
      category_id: data.categoryId,
      vessel_name: data.vesselName,
      builder: data.builder,
      model: data.model,
      year: data.year,
      colour: data.colour,
      engine_number: data.engineNumber,
      hull_number: data.hullNumber,
      length: data.length,
      width: data.width,
      owner_full_name: data.ownerFullName,
      owner_id_card: data.ownerIdCard,
      owner_address: data.ownerAddress,
      contact_number: data.contactNumber,
      annual_fee_expiry: data.annualFeeExpiry,
      insurance_expiry: data.insuranceExpiry,
      roadworthiness_expiry: data.roadworthinessExpiry,
      photograph,
      remarks: data.remarks,
      created_by: req.user!.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "A vessel with this registration number already exists." });
    throw error;
  }

  await logAudit({
    user: req.user!,
    action: "Added vessel",
    recordType: "vessel",
    recordId: inserted.id,
    recordLabel: data.registrationNumber,
  });

  res.status(201).json({ id: inserted.id, message: `Vessel ${data.registrationNumber} has been successfully added.` });
}

export async function update(req: Request, res: Response) {
  const data = vesselSchema.parse(req.body);
  const { data: existing } = await supabase.from("vessels").select("photograph").eq("id", req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: "Vessel not found." });

  const photograph = (req.file as Express.Multer.File | undefined)?.path || existing.photograph;

  const { error } = await supabase
    .from("vessels")
    .update({
      registration_number: data.registrationNumber,
      category_id: data.categoryId,
      vessel_name: data.vesselName,
      builder: data.builder,
      model: data.model,
      year: data.year,
      colour: data.colour,
      engine_number: data.engineNumber,
      hull_number: data.hullNumber,
      length: data.length,
      width: data.width,
      owner_full_name: data.ownerFullName,
      owner_id_card: data.ownerIdCard,
      owner_address: data.ownerAddress,
      contact_number: data.contactNumber,
      annual_fee_expiry: data.annualFeeExpiry,
      insurance_expiry: data.insuranceExpiry,
      roadworthiness_expiry: data.roadworthinessExpiry,
      photograph,
      remarks: data.remarks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id);

  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "A vessel with this registration number already exists." });
    throw error;
  }

  await logAudit({
    user: req.user!,
    action: "Edited vessel",
    recordType: "vessel",
    recordId: req.params.id,
    recordLabel: data.registrationNumber,
  });

  res.json({ message: `Vessel ${data.registrationNumber} has been updated.` });
}

export async function remove(req: Request, res: Response) {
  const { data: existing } = await supabase.from("vessels").select("registration_number").eq("id", req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: "Vessel not found." });

  const { error } = await supabase.from("vessels").delete().eq("id", req.params.id);
  if (error) throw error;

  await logAudit({
    user: req.user!,
    action: "Deleted vessel",
    recordType: "vessel",
    recordId: req.params.id,
    recordLabel: existing.registration_number,
  });

  res.json({ message: `Vessel ${existing.registration_number} has been deleted.` });
}

export async function uploadDocument(req: Request, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded." });

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert({
      record_type: "vessel",
      record_id: req.params.id,
      file_name: file.originalname,
      file_path: file.path,
      file_type: file.mimetype,
      file_size: file.size,
      uploaded_by: req.user!.id,
    })
    .select("id")
    .single();

  if (error) throw error;
  res.status(201).json({ id: inserted.id, message: "Document uploaded successfully." });
}
