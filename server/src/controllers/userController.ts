import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import supabase from "../db/supabase";
import { userCreateSchema } from "../utils/validation";
import { logAudit } from "../utils/audit";

function toPublicUser(row: any) {
  return {
    id: row.id,
    serviceNumber: row.service_number,
    fullName: row.full_name,
    role: row.role,
    profilePicture: row.profile_picture,
    canAddRecords: !!row.can_add_records,
    canEditRecords: !!row.can_edit_records,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

export async function getProfile(req: Request, res: Response) {
  const { data: row, error } = await supabase.from("users").select("*").eq("id", req.user!.id).maybeSingle();
  if (error) throw error;
  if (!row) return res.status(404).json({ error: "User not found." });
  res.json({ user: toPublicUser(row) });
}

export async function updateProfilePicture(req: Request, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No image uploaded." });
  const { error } = await supabase
    .from("users")
    .update({ profile_picture: file.path, updated_at: new Date().toISOString() })
    .eq("id", req.user!.id);
  if (error) throw error;
  await logAudit({ user: req.user!, action: "Updated profile picture" });
  res.json({ message: "Profile picture updated.", profilePicture: file.path });
}

// ---- Administrator: user management ----

export async function listUsers(_req: Request, res: Response) {
  const { data, error } = await supabase.from("users").select("*").order("full_name", { ascending: true });
  if (error) throw error;
  res.json({ items: (data || []).map(toPublicUser) });
}

export async function createUser(req: Request, res: Response) {
  const data = userCreateSchema.parse(req.body);

  const { data: existing } = await supabase.from("users").select("id").eq("service_number", data.serviceNumber).maybeSingle();
  if (existing) return res.status(409).json({ error: "A user with this service number already exists." });

  const passwordHash = bcrypt.hashSync(data.password, 12);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      service_number: data.serviceNumber,
      full_name: data.fullName,
      password_hash: passwordHash,
      role: data.role,
      can_add_records: !!data.canAddRecords,
      can_edit_records: !!data.canEditRecords,
    })
    .select("id")
    .single();

  if (error) throw error;

  await logAudit({ user: req.user!, action: "Created user account", recordType: "user", recordId: inserted.id, recordLabel: data.serviceNumber });

  res.status(201).json({ id: inserted.id, message: `User account for ${data.fullName} created.` });
}

export async function resetPassword(req: Request, res: Response) {
  const { newPassword } = req.body as { newPassword: string };
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }
  const { data: target } = await supabase.from("users").select("*").eq("id", req.params.id).maybeSingle();
  if (!target) return res.status(404).json({ error: "User not found." });

  const hash = bcrypt.hashSync(newPassword, 12);
  const { error } = await supabase
    .from("users")
    .update({ password_hash: hash, failed_login_attempts: 0, locked_until: null, updated_at: new Date().toISOString() })
    .eq("id", req.params.id);
  if (error) throw error;

  await logAudit({ user: req.user!, action: "Reset user password", recordType: "user", recordId: target.id, recordLabel: target.service_number });

  res.json({ message: `Password for ${target.full_name} has been reset.` });
}

export async function updateUserPermissions(req: Request, res: Response) {
  const { role, canAddRecords, canEditRecords, isActive } = req.body as {
    role?: "admin" | "staff";
    canAddRecords?: boolean;
    canEditRecords?: boolean;
    isActive?: boolean;
  };
  const { data: target } = await supabase.from("users").select("*").eq("id", req.params.id).maybeSingle();
  if (!target) return res.status(404).json({ error: "User not found." });

  const { error } = await supabase
    .from("users")
    .update({
      role: role ?? target.role,
      can_add_records: canAddRecords === undefined ? target.can_add_records : !!canAddRecords,
      can_edit_records: canEditRecords === undefined ? target.can_edit_records : !!canEditRecords,
      is_active: isActive === undefined ? target.is_active : !!isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id);
  if (error) throw error;

  await logAudit({ user: req.user!, action: "Updated user permissions", recordType: "user", recordId: target.id, recordLabel: target.service_number });

  res.json({ message: "User permissions updated." });
}
