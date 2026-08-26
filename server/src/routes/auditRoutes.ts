import { Router } from "express";
import { listAuditLog } from "../controllers/auditController";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), asyncHandler(listAuditLog));

export default router;
