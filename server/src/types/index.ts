export interface AuthUser {
  id: string;
  serviceNumber: string;
  fullName: string;
  role: "admin" | "staff";
  canAddRecords: boolean;
  canEditRecords: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
