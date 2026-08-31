export type ExpiryStatus = "expired" | "critical" | "expiring_soon" | "valid" | "not_set";

export interface AuthUser {
  id: string;
  serviceNumber: string;
  fullName: string;
  role: "admin" | "staff";
  canAddRecords: boolean;
  canEditRecords: boolean;
  profilePicture?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface RecordStatus {
  annualFee: ExpiryStatus;
  insurance: ExpiryStatus;
  roadworthiness: ExpiryStatus;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  categoryId: string;
  categoryName: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  colour?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  ownerFullName: string;
  ownerIdCard: string;
  ownerAddress: string;
  contactNumber?: string | null;
  annualFeeExpiry: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  photograph?: string | null;
  remarks?: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Vessel {
  id: string;
  registrationNumber: string;
  categoryId: string;
  categoryName: string;
  vesselName?: string | null;
  builder?: string | null;
  model?: string | null;
  year?: number | null;
  colour?: string | null;
  engineNumber?: string | null;
  hullNumber?: string | null;
  length?: number | null;
  width?: number | null;
  ownerFullName: string;
  ownerIdCard: string;
  ownerAddress: string;
  contactNumber?: string | null;
  annualFeeExpiry: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  photograph?: string | null;
  remarks?: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  userName: string;
  serviceNumber: string;
  action: string;
  recordType?: string | null;
  recordId?: string | null;
  recordLabel?: string | null;
  changes?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ForeignerStatus {
  passport: ExpiryStatus;
  visa: ExpiryStatus;
}

export interface Foreigner {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  country: string;
  passportNumber: string;
  passportExpiryDate?: string | null;
  workVisaNumber: string;
  workVisaExpiryDate?: string | null;
  contactNumber?: string | null;
  presentAddress?: string | null;
  workPlace?: string | null;
  sponsor?: string | null;
  occupation?: string | null;
  durationInIsland?: string | null;
  durationInMaldives?: string | null;
  status: ForeignerStatus;
  createdAt: string;
  updatedAt: string;
}
