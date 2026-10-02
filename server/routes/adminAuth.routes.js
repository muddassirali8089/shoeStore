import { Router } from "express";
import rateLimit from "express-rate-limit";
import { currentAdmin, forgotPassword, login, logout, resetPassword, verifyCode } from "../controllers/adminAuth.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests. Try again later." },
});

router.post("/login", authLimiter, login);
router.post("/logout", requireAdmin, logout);
router.get("/me", requireAdmin, currentAdmin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-code", authLimiter, verifyCode);
router.post("/reset-password", authLimiter, resetPassword);

export default router;