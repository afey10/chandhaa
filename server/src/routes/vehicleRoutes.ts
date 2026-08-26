import { Router } from "express";
import * as ctrl from "../controllers/vehicleController";
import { requireAuth, requireAddPermission, requireEditPermission, requireRole } from "../middleware/auth";
import { uploadPhoto, uploadDocument } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", asyncHandler(ctrl.getDashboard));
router.get("/expiring", asyncHandler(ctrl.getExpiringList));
router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", requireAddPermission, uploadPhoto.single("photograph"), asyncHandler(ctrl.create));
router.put("/:id", requireEditPermission, uploadPhoto.single("photograph"), asyncHandler(ctrl.update));
router.delete("/:id", requireRole("admin"), asyncHandler(ctrl.remove));
router.post("/:id/documents", requireEditPermission, uploadDocument.single("document"), asyncHandler(ctrl.uploadDocument));

export default router;
