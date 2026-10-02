import { Router } from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controllers/catalog.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadProductImages } from "../middleware/imageUpload.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", requireAdmin, uploadProductImages, createProduct);
router.patch("/:id", requireAdmin, uploadProductImages, updateProduct);
router.put("/:id", requireAdmin, uploadProductImages, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;