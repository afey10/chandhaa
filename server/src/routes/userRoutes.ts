import { Router } from "express";
import * as ctrl from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadProfilePicture } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/profile", asyncHandler(ctrl.getProfile));
router.post("/profile/picture", uploadProfilePicture.single("picture"), asyncHandler(ctrl.updateProfilePicture));

// Administrator only
router.get("/", requireRole("admin"), asyncHandler(ctrl.listUsers));
router.post("/", requireRole("admin"), asyncHandler(ctrl.createUser));
router.post("/:id/reset-password", requireRole("admin"), asyncHandler(ctrl.resetPassword));
router.put("/:id/permissions", requireRole("admin"), asyncHandler(ctrl.updateUserPermissions));

export default router;
