import { Router } from "express";
import { createDiscount, deleteDiscount, getDiscount, listDiscounts, updateDiscount } from "../controllers/discount.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAdmin);
router.get("/", listDiscounts);
router.get("/:id", getDiscount);
router.post("/", createDiscount);
router.patch("/:id", updateDiscount);
router.put("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);

export default router;