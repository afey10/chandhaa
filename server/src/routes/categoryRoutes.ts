import { Router } from "express";
import * as ctrl from "../controllers/categoryController";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/vehicle-categories", asyncHandler(ctrl.listVehicleCategories));
router.post("/vehicle-categories", requireRole("admin"), asyncHandler(ctrl.createVehicleCategory));
router.delete("/vehicle-categories/:id", requireRole("admin"), asyncHandler(ctrl.deleteVehicleCategory));

router.get("/vessel-categories", asyncHandler(ctrl.listVesselCategories));
router.post("/vessel-categories", requireRole("admin"), asyncHandler(ctrl.createVesselCategory));
router.delete("/vessel-categories/:id", requireRole("admin"), asyncHandler(ctrl.deleteVesselCategory));

export default router;
