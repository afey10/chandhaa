import { Request, Response } from "express";
import supabase from "../db/supabase";
import { categorySchema } from "../utils/validation";
import { logAudit } from "../utils/audit";

export async function listVehicleCategories(_req: Request, res: Response) {
  const { data, error } = await supabase.from("vehicle_categories").select("*").order("name", { ascending: true });
  if (error) throw error;
  res.json({ items: data });
}

export async function createVehicleCategory(req: Request, res: Response) {
  const { name } = categorySchema.parse(req.body);
  const { data, error } = await supabase.from("vehicle_categories").insert({ name }).select("id, name").single();
  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "A category with this name already exists." });
    throw error;
  }
  await logAudit({ user: req.user!, action: "Added vehicle category", recordType: "category", recordId: data.id, recordLabel: name });
  res.status(201).json(data);
}

export async function deleteVehicleCategory(req: Request, res: Response) {
  const { count } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("category_id", req.params.id);
  if ((count || 0) > 0) {
    return res.status(409).json({ error: "This category is in use by existing vehicles and cannot be deleted." });
  }
  const { error } = await supabase.from("vehicle_categories").delete().eq("id", req.params.id);
  if (error) throw error;
  await logAudit({ user: req.user!, action: "Deleted vehicle category", recordType: "category", recordId: req.params.id });
  res.json({ success: true });
}

export async function listVesselCategories(_req: Request, res: Response) {
  const { data, error } = await supabase.from("vessel_categories").select("*").order("name", { ascending: true });
  if (error) throw error;
  res.json({ items: data });
}

export async function createVesselCategory(req: Request, res: Response) {
  const { name } = categorySchema.parse(req.body);
  const { data, error } = await supabase.from("vessel_categories").insert({ name }).select("id, name").single();
  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "A category with this name already exists." });
    throw error;
  }
  await logAudit({ user: req.user!, action: "Added vessel category", recordType: "category", recordId: data.id, recordLabel: name });
  res.status(201).json(data);
}

export async function deleteVesselCategory(req: Request, res: Response) {
  const { count } = await supabase.from("vessels").select("*", { count: "exact", head: true }).eq("category_id", req.params.id);
  if ((count || 0) > 0) {
    return res.status(409).json({ error: "This category is in use by existing vessels and cannot be deleted." });
  }
  const { error } = await supabase.from("vessel_categories").delete().eq("id", req.params.id);
  if (error) throw error;
  await logAudit({ user: req.user!, action: "Deleted vessel category", recordType: "category", recordId: req.params.id });
  res.json({ success: true });
}
