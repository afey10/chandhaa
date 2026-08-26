import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import supabase from "../db/supabase";
import { loginSchema, changePasswordSchema } from "../utils/validation";
import { signToken } from "../middleware/auth";
import { logAudit } from "../utils/audit";
import { AuthUser } from "../types";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function toAuthUser(row: any): AuthUser {
  return {
    id: row.id,
    serviceNumber: row.service_number,
    fullName: row.full_name,
    role: row.role,
    canAddRecords: !!row.can_add_records,
    canEditRecords: !!row.can_edit_records,
  };
}

export async function login(req: Request, res: Response) {
  const { serviceNumber, password } = loginSchema.parse(req.body);

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("service_number", serviceNumber)
    .maybeSingle();

  if (error) throw error;

  if (!user || !user.is_active) {
    return res.status(401).json({ error: "Incorrect service number or password." });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
    return res.status(423).json({ error: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);

  if (!valid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockedUntil: string | null = null;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
    }
    await supabase
      .from("users")
      .update({ failed_login_attempts: attempts, locked_until: lockedUntil })
      .eq("id", user.id);
    return res.status(401).json({ error: "Incorrect service number or password." });
  }

  await supabase.from("users").update({ failed_login_attempts: 0, locked_until: null }).eq("id", user.id);

  const authUser = toAuthUser(user);
  const token = signToken(authUser);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });

  await logAudit({ user: authUser, action: "Logged in" });

  res.json({ user: authUser, token });
}

export async function logout(req: Request, res: Response) {
  if (req.user) {
    await logAudit({ user: req.user, action: "Logged out" });
  }
  res.clearCookie("token");
  res.json({ success: true });
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const { data: user, error } = await supabase.from("users").select("*").eq("id", req.user!.id).single();
  if (error) throw error;

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  await logAudit({ user: req.user!, action: "Changed own password" });

  res.json({ success: true, message: "Password updated successfully." });
}
