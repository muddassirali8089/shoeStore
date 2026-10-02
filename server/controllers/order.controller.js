import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import Order, { ORDER_STATUSES } from "../models/Order.js";
import Product from "../models/Product.js";
import StoreSettings from "../models/StoreSettings.js";
import { sendOrderEmail } from "../utils/mailer.js";

const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendError(res, error, fallback) {
  console.error("Order request failed:", error);
  const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? "A record with this value already exists." : error.name === "ValidationError" ? "Validation failed." : status >= 500 ? fallback : error.message;
  return res.status(status).json({
    success: false,
    message,
    ...(error.name === "ValidationError" ? { errors: Object.values(error.errors).map(({ path, message: detail }) => ({ field: path, message: detail })) } : {}),
    ...(status >= 500 && process.env.NODE_ENV !== "production" ? { error: error.message } : {}),
  });
}

function money(value) {
  return Math.round(value * 100) / 100;
}

function newOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ORD-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

async function restoreReservedStock(reservations) {
  const restored = [];
  try {
    for (const reservation of reservations) {
      const result = await Product.updateOne(
        { _id: reservation.productId, sizes: { $elemMatch: { size: reservation.size } } },
        { $inc: { "sizes.$.quantity": reservation.quantity } },
      );
      if (!result.matchedCount) throw new Error(`Could not restore size ${reservation.size} for product ${reservation.productId}.`);
      restored.push(reservation);
    }
  } catch (error) {
    await Promise.allSettled(restored.map(({ productId, size, quantity }) => Product.updateOne(
      { _id: productId, sizes: { $elemMatch: { size } } },
      { $inc: { "sizes.$.quantity": -quantity } },
    )));
    throw error;
  }
}

export async function createOrder(req, res) {
  const reservations = [];
  let discountReservation = null;
  let savedOrder = null;
  try {
    const { customer = {}, shippingAddress = {}, items = [] } = req.body;
    if (req.body.paymentMethod && req.body.paymentMethod !== "cash_on_delivery") {
      throw fail(400, "Only cash on delivery is accepted.");
    }
    const name = String(customer.name || customer.fullName || "").trim();
    const phone = String(customer.phone || "").trim();
    const email = String(customer.email || "").trim().toLowerCase();
    const address = String(shippingAddress.address || customer.address || "").trim();
    const city = String(shippingAddress.city || customer.city || "").trim();
    const province = String(shippingAddress.province || customer.province || "").trim();
    const postalCode = String(shippingAddress.postalCode || customer.postalCode || "").trim();
    if (!name || !phone || !address || !city || !province || !postalCode) {
      throw fail(400, "Customer name, phone, address, city, province, and postal code are required.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Customer email is invalid.");
    if (!Array.isArray(items) || items.length === 0) throw fail(400, "At least one order item is required.");

    const groupedItems = new Map();
    for (const item of items) {
      const productId = String(item.product || item.productId || "");
      const size = Number(item.size);
      const quantity = Number(item.quantity);
      if (!mongoose.isValidObjectId(productId)) throw fail(400, "Every order item must reference a valid product ID.");
      if (!Number.isFinite(size) || size <= 0 || !Number.isInteger(quantity) || quantity < 1) {
        throw fail(400, "Every order item must have a valid size and positive whole-number quantity.");
      }
      const key = `${productId}:${size}`;
      const current = groupedItems.get(key);
      groupedItems.set(key, current ? { ...current, quantity: current.quantity + quantity } : { productId, size, quantity });
    }

    const orderItems = [];
    let subtotal = 0;
    for (const requested of groupedItems.values()) {
      const product = await Product.findOne({ _id: requested.productId, status: "Active" }).populate("brand", "name");
      if (!product) throw fail(400, "One or more products are unavailable.");
      const sizeRow = product.sizes.find((entry) => entry.size === requested.size);
      if (!sizeRow) throw fail(400, `Size ${requested.size} is not available for ${product.name}.`);
      if (sizeRow.quantity < requested.quantity) throw fail(409, `Insufficient stock for ${product.name}, size ${requested.size}.`);
      const itemSubtotal = money(product.price * requested.quantity);
      subtotal += itemSubtotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        brand: product.brand?.name || "",
        image: product.images[0] || "",
        size: requested.size,
        quantity: requested.quantity,
        price: product.price,
        subtotal: itemSubtotal,
      });
    }
    subtotal = money(subtotal);

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (!settings.cashOnDeliveryEnabled) throw fail(503, "Cash on delivery is temporarily unavailable.");

    let shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShipping;
    let discountAmount = 0;
    let discountCode = "";
    if (req.body.discountCode) {
      const code = String(req.body.discountCode).trim().toUpperCase();
      const discount = await Discount.findOne({ code, status: "Active", startsAt: { $lte: new Date() }, endsAt: { $gte: new Date() } });
      if (!discount || (discount.usageLimit > 0 && discount.uses >= discount.usageLimit)) {
        throw fail(400, "Discount code is invalid, expired, or unavailable.");
      }
      discountCode = discount.code;
      if (discount.type === "Percentage") discountAmount = money(subtotal * discount.value / 100);
      if (discount.type === "Fixed amount") discountAmount = Math.min(subtotal, discount.value);
      if (discount.type === "Free shipping") shippingFee = 0;
      discountReservation = { id: discount._id, usageLimit: discount.usageLimit };
    }

    for (const requested of groupedItems.values()) {
      const result = await Product.updateOne(
        { _id: requested.productId, status: "Active", sizes: { $elemMatch: { size: requested.size, quantity: { $gte: requested.quantity } } } },
        { $inc: { "sizes.$.quantity": -requested.quantity } },
      );
      if (!result.modifiedCount) throw fail(409, `Stock changed while placing the order. Retry size ${requested.size}.`);
      reservations.push(requested);
    }

    if (discountReservation) {
      const filter = { _id: discountReservation.id, status: "Active", startsAt: { $lte: new Date() }, endsAt: { $gte: new Date() } };
      if (discountReservation.usageLimit > 0) filter.uses = { $lt: discountReservation.usageLimit };
      const reserved = await Discount.findOneAndUpdate(filter, { $inc: { uses: 1 } }, { new: true });
      if (!reserved) throw fail(409, "Discount code usage limit was reached. Retry without the code.");
      discountReservation.reserved = true;
    }

    const orderData = {
      orderNumber: newOrderNumber(),
      customer: { name, phone, email },
      shippingAddress: { address, city, province, postalCode },
      items: orderItems,
      subtotal,
      shippingFee,
      discount: money(discountAmount),
      discountCode,
      total: money(Math.max(0, subtotal - discountAmount + shippingFee)),
      paymentMethod: "cash_on_delivery",
      paymentStatus: "pending",
      orderStatus: "pending",
      orderNotes: String(req.body.orderNotes || req.body.notes || customer.notes || "").trim(),
    };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        savedOrder = await Order.create({ ...orderData, orderNumber: newOrderNumber() });
        break;
      } catch (error) {
        if (error.code !== 11000 || attempt === 2) throw error;
      }
    }

    try {
      await sendOrderEmail(email, `ShoeStore order ${savedOrder.orderNumber}`, `Your cash-on-delivery order ${savedOrder.orderNumber} was received. Total: ${savedOrder.total}.`);
    } catch (emailError) {
      console.error("Order confirmation email failed:", emailError);
    }
    return res.status(201).json({ success: true, message: "Order placed successfully.", data: savedOrder });
  } catch (error) {
    if (savedOrder) await Order.deleteOne({ _id: savedOrder._id });
    if (discountReservation?.reserved) await Discount.updateOne({ _id: discountReservation.id, uses: { $gt: 0 } }, { $inc: { uses: -1 } });
    if (reservations.length) {
      try {
        await restoreReservedStock(reservations);
      } catch (rollbackError) {
        console.error("Order inventory rollback failed:", rollbackError);
      }
    }
    return sendError(res, error, "Unable to place order.");
  }
}

export async function trackOrder(req, res) {
  try {
    const orderNumber = String(req.params.orderNumber || "").trim().toUpperCase();
    const phone = normalizePhone(req.query.phone);
    if (!orderNumber || !phone) throw fail(400, "Order number and checkout phone are required.");
    const order = await Order.findOne({ orderNumber });
    if (!order || normalizePhone(order.customer.phone) !== phone) throw fail(404, "Order not found for the supplied details.");
    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: order.items.map(({ name, image, size, quantity }) => ({ name, image, size, quantity })),
        total: order.total,
      },
    });
  } catch (error) {
    return sendError(res, error, "Unable to track order.");
  }
}

export async function listOrders(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) throw fail(400, "Order status is invalid.");
      filter.orderStatus = req.query.status;
    }
    if (req.query.paymentStatus) {
      if (!["pending", "received"].includes(req.query.paymentStatus)) throw fail(400, "Payment status is invalid.");
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.phone) filter["customer.phone"] = new RegExp(String(req.query.phone).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (req.query.orderNumber) filter.orderNumber = new RegExp(String(req.query.orderNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (req.query.customer) {
      const search = new RegExp(String(req.query.customer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ "customer.name": search }, { "customer.email": search }, { "customer.phone": search }];
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from && Number.isNaN(Date.parse(req.query.from))) throw fail(400, "Date filter is invalid.");
      if (req.query.to && Number.isNaN(Date.parse(req.query.to))) throw fail(400, "Date filter is invalid.");
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    ]);
    return res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return sendError(res, error, "Unable to load orders.");
  }
}

export async function getAdminOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid order ID.");
    const order = await Order.findById(req.params.id).populate("items.product", "name images brand category");
    if (!order) throw fail(404, "Order not found.");
    return res.json({ success: true, data: order });
  } catch (error) {
    return sendError(res, error, "Unable to load order.");
  }
}

async function updateOrderStatus(req, res, requestedStatus) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid order ID.");
    if (!ORDER_STATUSES.includes(requestedStatus)) throw fail(400, "Order status is invalid.");
    const order = await Order.findById(req.params.id);
    if (!order) throw fail(404, "Order not found.");
    if (!transitions[order.orderStatus]?.includes(requestedStatus)) {
      throw fail(409, `Order cannot transition from ${order.orderStatus} to ${requestedStatus}.`);
    }

    const restoresInventory = ["cancelled", "returned"].includes(requestedStatus);
    if (restoresInventory) {
      const updated = await Order.findOneAndUpdate(
        { _id: order._id, orderStatus: order.orderStatus, inventoryRestored: false },
        { $set: { orderStatus: requestedStatus, inventoryRestored: true } },
        { new: true },
      );
      if (!updated) throw fail(409, "Order changed while it was being updated.");
      try {
        await restoreReservedStock(order.items.map((item) => ({ productId: item.product, size: item.size, quantity: item.quantity })));
      } catch (stockError) {
        await Order.updateOne({ _id: updated._id, orderStatus: requestedStatus, inventoryRestored: true }, { $set: { orderStatus: order.orderStatus, inventoryRestored: false } });
        throw stockError;
      }
      order.orderStatus = updated.orderStatus;
      order.inventoryRestored = true;
    } else {
      const updated = await Order.findOneAndUpdate(
        { _id: order._id, orderStatus: order.orderStatus },
        { $set: { orderStatus: requestedStatus } },
        { new: true, runValidators: true },
      );
      if (!updated) throw fail(409, "Order changed while it was being updated.");
      order.orderStatus = updated.orderStatus;
    }

    try {
      const statusMessage = `Your ShoeStore order ${order.orderNumber} is now ${requestedStatus}.`;
      await sendOrderEmail(order.customer.email, `Order ${order.orderNumber} update`, statusMessage);
    } catch (emailError) {
      console.error("Order status email failed:", emailError);
    }
    return res.json({ success: true, message: `Order ${requestedStatus} successfully.`, data: order });
  } catch (error) {
    return sendError(res, error, "Unable to update order status.");
  }
}

export async function setOrderStatus(req, res) {
  return updateOrderStatus(req, res, String(req.body.status || ""));
}

export async function cancelOrder(req, res) {
  return updateOrderStatus(req, res, "cancelled");
}

export async function returnOrder(req, res) {
  return updateOrderStatus(req, res, "returned");
}

export async function setPaymentStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid order ID.");
    const paymentStatus = String(req.body.paymentStatus || "");
    if (!["pending", "received"].includes(paymentStatus)) throw fail(400, "Payment status must be pending or received.");
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: { paymentStatus } }, { new: true, runValidators: true });
    if (!order) throw fail(404, "Order not found.");
    return res.json({ success: true, message: "Payment status updated successfully.", data: order });
  } catch (error) {
    return sendError(res, error, "Unable to update payment status.");
  }
}