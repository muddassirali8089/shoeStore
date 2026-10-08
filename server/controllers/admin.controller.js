import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import StoreSettings from "../models/StoreSettings.js";

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendError(res, error, fallback) {
  console.error("Admin request failed:", error);
  const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? "A record with this value already exists." : error.name === "ValidationError" ? "Validation failed." : status >= 500 ? fallback : error.message;
  return res.status(status).json({ success: false, message, ...(status >= 500 && process.env.NODE_ENV !== "production" ? { error: error.message } : {}) });
}

function parseBoolean(value, field) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw fail(400, `${field} must be true or false.`);
}

export async function getAdminBrands(_req, res) {
  try {
    return res.json({ success: true, data: await Brand.find().sort({ name: 1 }) });
  } catch (error) {
    return sendError(res, error, "Unable to load brands.");
  }
}

export async function getAdminCategories(_req, res) {
  try {
    return res.json({ success: true, data: await Category.find().sort({ name: 1 }) });
  } catch (error) {
    return sendError(res, error, "Unable to load categories.");
  }
}

export async function getInventory(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const products = await Product.find().populate("brand category", "name").sort({ name: 1 }).lean();
    const rows = [];
    for (const product of products) {
      for (const size of product.sizes) {
        const status = size.quantity === 0 ? "OUT OF STOCK" : size.quantity <= 5 ? "LOW STOCK" : "IN STOCK";
        rows.push({
          productId: product._id,
          product: product.name,
          brand: product.brand?.name || "",
          category: product.category?.name || "",
          condition: product.condition,
          size: size.size,
          quantity: size.quantity,
          status,
        });
      }
    }
    const search = String(req.query.search || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").toUpperCase().replaceAll("-", " ");
    const filtered = rows.filter((row) => {
      const matchesSearch = !search || `${row.product} ${row.brand} ${row.category} ${row.size}`.toLowerCase().includes(search);
      const matchesStatus = !statusFilter || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit);
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return sendError(res, error, "Unable to load inventory.");
  }
}

export async function getDashboard(req, res) {
  try {
    const [totalProducts, totalCategories, totalBrands, totalOrders, totalPhones, statusCounts, sales, lowStock] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Brand.countDocuments(),
      Order.countDocuments(),
      Order.distinct("customer.phone"),
      Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { orderStatus: "delivered", paymentStatus: "received" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Product.aggregate([
        { $project: { totalStock: { $sum: "$sizes.quantity" } } },
        { $match: { totalStock: { $lte: 5 } } },
        { $count: "count" },
      ]),
    ]);
    const orderCounts = Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count]));
    const [pendingPayments, receivedPayments] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: "pending" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.aggregate([{ $match: { paymentStatus: "received" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);
    return res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalBrands,
        totalOrders,
        totalCustomers: totalPhones.length,
        pendingOrders: orderCounts.pending || 0,
        confirmedOrders: orderCounts.confirmed || 0,
        shippedOrders: orderCounts.shipped || 0,
        deliveredOrders: orderCounts.delivered || 0,
        cancelledOrders: orderCounts.cancelled || 0,
        returnedOrders: orderCounts.returned || 0,
        totalSales: sales[0]?.total || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        receivedPayments: receivedPayments[0]?.total || 0,
        lowStockProducts: lowStock[0]?.count || 0,
      },
    });
  } catch (error) {
    return sendError(res, error, "Unable to load dashboard statistics.");
  }
}

function buildCustomers(orders) {
  const customers = new Map();
  for (const order of orders) {
    const email = String(order.customer.email || "").trim().toLowerCase();
    const phone = String(order.customer.phone || "").replace(/\D/g, "");
    const key = email || phone;
    if (!key) continue;
    const row = customers.get(key) || {
      identifier: email || phone,
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
      city: order.shippingAddress.city,
      province: order.shippingAddress.province,
      orderCount: 0,
      totalSpent: 0,
      lastOrder: order.createdAt,
      orders: [],
    };
    row.orderCount += 1;
    if (order.orderStatus !== "cancelled") row.totalSpent += order.total;
    row.orders.push(order);
    if (order.createdAt > row.lastOrder) {
      row.lastOrder = order.createdAt;
      row.name = order.customer.name;
      row.phone = order.customer.phone;
      row.email = order.customer.email;
      row.city = order.shippingAddress.city;
      row.province = order.shippingAddress.province;
    }
    customers.set(key, row);
  }
  return [...customers.values()].sort((left, right) => new Date(right.lastOrder) - new Date(left.lastOrder));
}

export async function listCustomers(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    let customers = buildCustomers(orders);
    const search = String(req.query.search || "").trim().toLowerCase();
    if (search) customers = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email} ${customer.city}`.toLowerCase().includes(search));
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const total = customers.length;
    const data = customers.slice((page - 1) * limit, page * limit).map(({ orders: _orders, ...customer }) => customer);
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return sendError(res, error, "Unable to load customers.");
  }
}

export async function getCustomer(req, res) {
  try {
    const identifier = decodeURIComponent(req.params.identifier).trim().toLowerCase();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const customer = buildCustomers(orders).find((row) => row.identifier.toLowerCase() === identifier || row.email.toLowerCase() === identifier || row.phone.toLowerCase() === identifier);
    if (!customer) throw fail(404, "Customer not found.");
    return res.json({ success: true, data: customer });
  } catch (error) {
    return sendError(res, error, "Unable to load customer.");
  }
}

async function getOrCreateSettings() {
  return StoreSettings.findOneAndUpdate(
    { key: "store" },
    { $setOnInsert: { key: "store" } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
}

export async function getSettings(_req, res) {
  try {
    return res.json({ success: true, data: await getOrCreateSettings() });
  } catch (error) {
    return sendError(res, error, "Unable to load store settings.");
  }
}

export async function updateSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    const numberFields = ["taxRate", "freeShippingThreshold", "standardShipping", "expressShipping", "processingDays"];
    for (const field of numberFields) {
      if (req.body[field] === undefined) continue;
      const value = Number(req.body[field]);
      if (!Number.isFinite(value) || value < 0) throw fail(400, `${field} must be a non-negative number.`);
      settings[field] = value;
    }
    for (const field of ["storeName", "storeEmail", "currency"]) {
      if (req.body[field] !== undefined) settings[field] = String(req.body[field]).trim();
    }
    if (req.body.storeName !== undefined && !settings.storeName) throw fail(400, "Store name is required.");
    if (req.body.storeEmail !== undefined && settings.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.storeEmail)) throw fail(400, "Store email is invalid.");
    if (req.body.maintenanceMode !== undefined) settings.maintenanceMode = parseBoolean(req.body.maintenanceMode, "maintenanceMode");
    if (req.body.cashOnDeliveryEnabled !== undefined) settings.cashOnDeliveryEnabled = parseBoolean(req.body.cashOnDeliveryEnabled, "cashOnDeliveryEnabled");
    await settings.save();
    return res.json({ success: true, message: "Store settings updated successfully.", data: settings });
  } catch (error) {
    return sendError(res, error, "Unable to update store settings.");
  }
}