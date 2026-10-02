import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import connectDB from "./connection/connectDB.js";
import { seedAdmin } from "./utils/seedAdmin.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";

const app = express();
const api = "/api/v1";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
    : true,
}));
app.use(express.json({ limit: "1mb", strict: false }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) req.body = {};
  return next();
});

app.get("/", (_req, res) => res.json({ success: true, message: "ShoeStore API is running." }));
app.get(`${api}/health`, (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? "ok" : "degraded", database: connected ? "connected" : "disconnected" },
  });
});

app.use(`${api}/admin/auth`, adminAuthRoutes);
app.use(`${api}/admin`, adminAuthRoutes);
app.use(`${api}/products`, productRoutes);
app.use(`${api}/brands`, brandRoutes);
app.use(`${api}/categories`, categoryRoutes);
app.use(`${api}/orders`, orderRoutes);
app.use(`${api}/discounts`, discountRoutes);
app.use(`${api}/admin/discounts`, discountRoutes);
app.use(`${api}/admin`, adminRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));

export default app;

export async function start() {
  try {
    await connectDB();
    await seedAdmin();
    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => console.log(`ShoeStore API listening on http://localhost:${port}.`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  start();
}