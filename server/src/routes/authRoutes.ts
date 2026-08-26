import { Router } from "express";
import { login, logout, me, changePassword } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/logout", requireAuth, asyncHandler(logout));
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, asyncHandler(changePassword));

export default router;
