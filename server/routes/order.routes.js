import { Router } from "express";
import { cancelOrder, createOrder, getAdminOrder, listOrders, returnOrder, setOrderStatus, setPaymentStatus, trackOrder } from "../controllers/order.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", createOrder);
router.get("/admin/list", requireAdmin, listOrders);
router.get("/admin/:id", requireAdmin, getAdminOrder);
router.patch("/admin/:id/status", requireAdmin, setOrderStatus);
router.patch("/admin/:id/payment-status", requireAdmin, setPaymentStatus);
router.patch("/admin/:id/cancel", requireAdmin, cancelOrder);
router.patch("/admin/:id/return", requireAdmin, returnOrder);
router.get("/track/:orderNumber", trackOrder);
router.get("/:orderNumber", trackOrder);

export default router;