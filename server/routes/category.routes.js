import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/brandCategory.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", requireAdmin, createCategory);
router.patch("/:id", requireAdmin, updateCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;