import { z } from "zod";

export const loginSchema = z.object({
  serviceNumber: z.string().min(1, "Service number is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

const dateStr = z.string().refine((v) => !isNaN(Date.parse(v)), "Must be a valid date");

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  categoryId: z.string().min(1, "Category is required"),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  colour: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  chassisNumber: z.string().optional().nullable(),
  ownerFullName: z.string().min(1, "Owner full name is required"),
  ownerIdCard: z.string().min(1, "Owner ID card number is required"),
  ownerAddress: z.string().min(1, "Owner address is required"),
  contactNumber: z.string().optional().nullable(),
  annualFeeExpiry: dateStr,
  insuranceExpiry: dateStr,
  roadworthinessExpiry: dateStr,
  remarks: z.string().optional().nullable(),
});

export const vesselSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  categoryId: z.string().min(1, "Category is required"),
  vesselName: z.string().optional().nullable(),
  builder: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  colour: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  hullNumber: z.string().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  ownerFullName: z.string().min(1, "Owner full name is required"),
  ownerIdCard: z.string().min(1, "Owner ID card number is required"),
  ownerAddress: z.string().min(1, "Owner address is required"),
  contactNumber: z.string().optional().nullable(),
  annualFeeExpiry: dateStr,
  insuranceExpiry: dateStr,
  roadworthinessExpiry: dateStr,
  remarks: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const userCreateSchema = z.object({
  serviceNumber: z.string().min(1),
  fullName: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff"]),
  canAddRecords: z.boolean().optional(),
  canEditRecords: z.boolean().optional(),
});
