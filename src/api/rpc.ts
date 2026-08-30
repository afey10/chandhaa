import supabase from "./supabaseClient";

const TOKEN_KEY = "veymandoo_session_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getErrorMessage(err: unknown): string {
  const anyErr = err as any;
  if (anyErr?.message?.includes("Failed to fetch") || anyErr?.message?.includes("placeholder.invalid")) {
    return "Supabase is not configured for this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.";
  }
  return anyErr?.message || "Something went wrong. Please try again.";
}

/** Calls a Postgres RPC function and throws a plain Error with the
 * database's message on failure (e.g. "Incorrect service number or password."). */
async function call<T = any>(fn: string, params: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    // Supabase prefixes some errors; strip a leading "P0001: " style code if present.
    const message = error.message?.replace(/^\s*[A-Z0-9]{5}:\s*/, "") || "Something went wrong.";
    throw new Error(message);
  }
  return data as T;
}

/** Calls an RPC that requires the current session token, auto-attached as p_token. */
async function authedCall<T = any>(fn: string, params: Record<string, any> = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return call<T>(fn, { p_token: token, ...params });
}

// ---------------- Auth ----------------

export async function login(serviceNumber: string, password: string) {
  const result = await call<{ token: string; user: any }>("login", {
    p_service_number: serviceNumber,
    p_password: password,
  });
  setToken(result.token);
  return result.user;
}

export async function logout() {
  const token = getToken();
  clearToken();
  if (token) {
    try {
      await call("logout", { p_token: token });
    } catch {
      // token already invalid/expired - fine, we've cleared it locally anyway
    }
  }
}

export async function getMe() {
  const token = getToken();
  if (!token) return null;
  try {
    return await call("get_me", { p_token: token });
  } catch {
    clearToken();
    return null;
  }
}

export const getProfile = () => authedCall("get_profile");
export const changePassword = (currentPassword: string, newPassword: string) =>
  authedCall("change_password", { p_current_password: currentPassword, p_new_password: newPassword });

// ---------------- File uploads (Supabase Storage) ----------------

/** Uploads a file to the public `uploads` bucket under the given folder and
 * returns the storage path to store on the record (e.g. "uploads/vehicles/xyz.jpg"). */
export async function uploadFile(file: File, folder: "vehicles" | "vessels" | "profiles" | "documents"): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export function publicFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------- Vehicles ----------------

export const getVehicleDashboard = (warningDays = 30) => authedCall("get_vehicle_dashboard", { p_warning_days: warningDays });
export const getVehiclesExpiring = (type: string, warningDays = 30) =>
  authedCall<{ items: any[] }>("get_vehicles_expiring", { p_type: type, p_warning_days: warningDays });
export const listVehicles = (params: Record<string, any>) =>
  authedCall("list_vehicles", {
    p_search: params.search || "",
    p_category: params.category || null,
    p_overall_status: params.overallStatus || "",
    p_sort_by: params.sortBy || "registration_number",
    p_sort_dir: params.sortDir || "asc",
    p_page: params.page || 1,
    p_page_size: params.pageSize || 20,
  });
export const getVehicle = (id: string) => authedCall<{ vehicle: any; documents: any[] }>("get_vehicle", { p_id: id });
export const createVehicle = (data: Record<string, any>) => authedCall<{ id: string; message: string }>("create_vehicle", { p_data: data });
export const updateVehicle = (id: string, data: Record<string, any>) =>
  authedCall<{ message: string }>("update_vehicle", { p_id: id, p_data: data });
export const deleteVehicle = (id: string) => authedCall<{ message: string }>("delete_vehicle", { p_id: id });

// ---------------- Vessels ----------------

export const getVesselDashboard = (warningDays = 30) => authedCall("get_vessel_dashboard", { p_warning_days: warningDays });
export const getVesselsExpiring = (type: string, warningDays = 30) =>
  authedCall<{ items: any[] }>("get_vessels_expiring", { p_type: type, p_warning_days: warningDays });
export const listVessels = (params: Record<string, any>) =>
  authedCall("list_vessels", {
    p_search: params.search || "",
    p_category: params.category || null,
    p_overall_status: params.overallStatus || "",
    p_sort_by: params.sortBy || "registration_number",
    p_sort_dir: params.sortDir || "asc",
    p_page: params.page || 1,
    p_page_size: params.pageSize || 20,
  });
export const getVessel = (id: string) => authedCall<{ vessel: any; documents: any[] }>("get_vessel", { p_id: id });
export const createVessel = (data: Record<string, any>) => authedCall<{ id: string; message: string }>("create_vessel", { p_data: data });
export const updateVessel = (id: string, data: Record<string, any>) =>
  authedCall<{ message: string }>("update_vessel", { p_id: id, p_data: data });
export const deleteVessel = (id: string) => authedCall<{ message: string }>("delete_vessel", { p_id: id });

// ---------------- Categories ----------------

export const listVehicleCategories = () => authedCall<any[]>("list_vehicle_categories");
export const createVehicleCategory = (name: string) => authedCall("create_vehicle_category", { p_name: name });
export const deleteVehicleCategory = (id: string) => authedCall("delete_vehicle_category", { p_id: id });

export const listVesselCategories = () => authedCall<any[]>("list_vessel_categories");
export const createVesselCategory = (name: string) => authedCall("create_vessel_category", { p_name: name });
export const deleteVesselCategory = (id: string) => authedCall("delete_vessel_category", { p_id: id });

// ---------------- Admin: users ----------------

export const listUsers = () => authedCall<any[]>("list_users");
export const createUser = (params: {
  serviceNumber: string;
  fullName: string;
  password: string;
  role: "admin" | "staff";
  canAddRecords: boolean;
  canEditRecords: boolean;
}) =>
  authedCall("create_user", {
    p_service_number: params.serviceNumber,
    p_full_name: params.fullName,
    p_password: params.password,
    p_role: params.role,
    p_can_add: params.canAddRecords,
    p_can_edit: params.canEditRecords,
  });
export const adminResetPassword = (userId: string, newPassword: string) =>
  authedCall("admin_reset_password", { p_user_id: userId, p_new_password: newPassword });
export const updateUserPermissions = (
  userId: string,
  patch: { role?: string; canAddRecords?: boolean; canEditRecords?: boolean; isActive?: boolean }
) =>
  authedCall("update_user_permissions", {
    p_user_id: userId,
    p_role: patch.role ?? null,
    p_can_add: patch.canAddRecords ?? null,
    p_can_edit: patch.canEditRecords ?? null,
    p_is_active: patch.isActive ?? null,
  });
export const updateProfilePicture = (path: string) => authedCall("update_profile_picture", { p_path: path });

// ---------------- Audit log ----------------

export const listAuditLog = (params: { search?: string; recordType?: string; page?: number; pageSize?: number }) =>
  authedCall("list_audit_log", {
    p_search: params.search || "",
    p_record_type: params.recordType || "",
    p_page: params.page || 1,
    p_page_size: params.pageSize || 50,
  });
