import { Router } from "express";
import { createBrand, deleteBrand, getBrand, getBrands, updateBrand } from "../controllers/brandCategory.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getBrands);
router.get("/:id", getBrand);
router.post("/", requireAdmin, createBrand);
router.patch("/:id", requireAdmin, updateBrand);
router.put("/:id", requireAdmin, updateBrand);
router.delete("/:id", requireAdmin, deleteBrand);

export default router;