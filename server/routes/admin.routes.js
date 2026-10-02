import { Router } from "express";
import { getAdminBrands, getAdminCategories, getCustomer, getDashboard, getInventory, getSettings, listCustomers, updateSettings } from "../controllers/admin.controller.js";
import { getProduct, getProducts } from "../controllers/catalog.controller.js";
import { getAdminOrder, listOrders, setOrderStatus, setPaymentStatus } from "../controllers/order.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", getDashboard);
router.get("/dashboard/stats", getDashboard);
router.get("/inventory", getInventory);
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.get("/orders", listOrders);
router.get("/orders/:id", getAdminOrder);
router.patch("/orders/:id/status", setOrderStatus);
router.patch("/orders/:id/payment-status", setPaymentStatus);
router.get("/customers", listCustomers);
router.get("/customers/:identifier", getCustomer);
router.get("/brands", getAdminBrands);
router.get("/categories", getAdminCategories);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;