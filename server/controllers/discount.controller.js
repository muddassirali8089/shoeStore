import mongoose from "mongoose";
import Discount from "../models/Discount.js";

const types = ["Percentage", "Fixed amount", "Free shipping"];
const statuses = ["Active", "Scheduled", "Inactive"];

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendError(res, error, fallback) {
  console.error("Discount request failed:", error);
  const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? "That discount code is already in use." : error.name === "ValidationError" ? "Validation failed." : status >= 500 ? fallback : error.message;
  return res.status(status).json({ success: false, message, ...(status >= 500 && process.env.NODE_ENV !== "production" ? { error: error.message } : {}) });
}

function discountFields(body, partial = false) {
  const fields = {};
  if (!partial || body.name !== undefined) fields.name = String(body.name || "").trim();
  if (!partial || body.code !== undefined || body.couponCode !== undefined) {
    fields.code = String(body.code || body.couponCode || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(fields.code)) throw fail(400, "Discount code must contain 3 to 32 letters, numbers, hyphens, or underscores.");
  }
  if (!partial || body.type !== undefined || body.discountType !== undefined) {
    fields.type = body.type || body.discountType;
    if (!types.includes(fields.type)) throw fail(400, "Discount type is invalid.");
  }
  if (!partial || body.value !== undefined || body.discountValue !== undefined) {
    fields.value = Number(body.value ?? body.discountValue ?? 0);
    if (!Number.isFinite(fields.value) || fields.value < 0) throw fail(400, "Discount value must be non-negative.");
  }
  for (const [target, aliases] of [["startsAt", ["startsAt", "startDate"]], ["endsAt", ["endsAt", "endDate"]]]) {
    const source = aliases.find((key) => body[key] !== undefined);
    if (!partial || source) {
      const date = new Date(source ? body[source] : "");
      if (Number.isNaN(date.getTime())) throw fail(400, `${target} must be a valid date.`);
      fields[target] = date;
    }
  }
  if (!partial || body.status !== undefined) {
    fields.status = body.status || "Active";
    if (!statuses.includes(fields.status)) throw fail(400, "Discount status is invalid.");
  }
  if (!partial || body.usageLimit !== undefined) {
    fields.usageLimit = Number(body.usageLimit || 0);
    if (!Number.isInteger(fields.usageLimit) || fields.usageLimit < 0) throw fail(400, "Usage limit must be a non-negative whole number.");
  }
  if (fields.type === "Percentage" && fields.value !== undefined && (fields.value < 1 || fields.value > 100)) {
    throw fail(400, "Percentage discounts must be between 1 and 100.");
  }
  if (fields.type === "Fixed amount" && fields.value !== undefined && fields.value < 1) {
    throw fail(400, "Fixed discounts must be greater than zero.");
  }
  if (fields.type === "Free shipping") fields.value = 0;
  return fields;
}

function validateDateOrder(fields, existing) {
  const startsAt = fields.startsAt || existing?.startsAt;
  const endsAt = fields.endsAt || existing?.endsAt;
  if (startsAt && endsAt && startsAt > endsAt) throw fail(400, "Discount end date must be after its start date.");
}

export async function listDiscounts(_req, res) {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: discounts });
  } catch (error) {
    return sendError(res, error, "Unable to load discounts.");
  }
}

export async function getDiscount(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid discount ID.");
    const discount = await Discount.findById(req.params.id);
    if (!discount) throw fail(404, "Discount not found.");
    return res.json({ success: true, data: discount });
  } catch (error) {
    return sendError(res, error, "Unable to load discount.");
  }
}

export async function createDiscount(req, res) {
  try {
    const fields = discountFields(req.body);
    validateDateOrder(fields);
    const discount = await Discount.create(fields);
    return res.status(201).json({ success: true, message: "Discount created successfully.", data: discount });
  } catch (error) {
    return sendError(res, error, "Unable to create discount.");
  }
}

export async function updateDiscount(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid discount ID.");
    const discount = await Discount.findById(req.params.id);
    if (!discount) throw fail(404, "Discount not found.");
    const fields = discountFields(req.body, true);
    validateDateOrder(fields, discount);
    Object.assign(discount, fields);
    await discount.save();
    return res.json({ success: true, message: "Discount updated successfully.", data: discount });
  } catch (error) {
    return sendError(res, error, "Unable to update discount.");
  }
}

export async function deleteDiscount(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid discount ID.");
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) throw fail(404, "Discount not found.");
    return res.json({ success: true, message: "Discount deleted successfully." });
  } catch (error) {
    return sendError(res, error, "Unable to delete discount.");
  }
}