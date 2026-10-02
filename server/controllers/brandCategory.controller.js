import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendError(res, error, fallback) {
  console.error("Catalog management failed:", error);
  const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? "A record with this name already exists." : error.name === "ValidationError" ? "Validation failed." : status >= 500 ? fallback : error.message;
  return res.status(status).json({ success: false, message, ...(status >= 500 && process.env.NODE_ENV !== "production" ? { error: error.message } : {}) });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createHandlers(Model, fieldName) {
  const title = fieldName;

  async function list(req, res) {
    try {
      const filter = req.admin ? {} : { status: "Active" };
      const search = String(req.query.search || "").trim();
      if (search) filter.name = new RegExp(escapeRegex(search), "i");
      const records = await Model.find(filter).sort({ name: 1 });
      return res.json({ success: true, data: records });
    } catch (error) {
      return sendError(res, error, `Unable to load ${title.toLowerCase()}s.`);
    }
  }

  async function getOne(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, `Invalid ${title.toLowerCase()} ID.`);
      const filter = { _id: req.params.id };
      if (!req.admin) filter.status = "Active";
      const record = await Model.findOne(filter);
      if (!record) throw fail(404, `${title} not found.`);
      return res.json({ success: true, data: record });
    } catch (error) {
      return sendError(res, error, `Unable to load ${title.toLowerCase()}.`);
    }
  }

  async function create(req, res) {
    try {
      const name = String(req.body.name || "").trim();
      if (!name) throw fail(400, `${title} name is required.`);
      const fields = { name, status: req.body.status || "Active" };
      if (fieldName === "Category") {
        fields.description = req.body.description || "";
        fields.image = req.body.image || "";
      } else {
        fields.logo = req.body.logo || "";
      }
      const record = await Model.create(fields);
      return res.status(201).json({ success: true, message: `${title} created successfully.`, data: record });
    } catch (error) {
      return sendError(res, error, `Unable to create ${title.toLowerCase()}.`);
    }
  }

  async function update(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, `Invalid ${title.toLowerCase()} ID.`);
      const record = await Model.findById(req.params.id);
      if (!record) throw fail(404, `${title} not found.`);
      const fields = ["name", "status", ...(fieldName === "Category" ? ["description", "image"] : ["logo"])];
      for (const field of fields) {
        if (req.body[field] !== undefined) record[field] = req.body[field];
      }
      if (!record.name.trim()) throw fail(400, `${title} name is required.`);
      await record.save();
      return res.json({ success: true, message: `${title} updated successfully.`, data: record });
    } catch (error) {
      return sendError(res, error, `Unable to update ${title.toLowerCase()}.`);
    }
  }

  async function remove(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, `Invalid ${title.toLowerCase()} ID.`);
      const record = await Model.findById(req.params.id);
      if (!record) throw fail(404, `${title} not found.`);
      const reference = fieldName === "Brand" ? "brand" : "category";
      const productCount = await Product.countDocuments({ [reference]: record._id });
      if (productCount) throw fail(409, `Cannot delete this ${title.toLowerCase()} while products reference it.`);
      await record.deleteOne();
      return res.json({ success: true, message: `${title} deleted successfully.` });
    } catch (error) {
      return sendError(res, error, `Unable to delete ${title.toLowerCase()}.`);
    }
  }

  return { list, getOne, create, update, remove };
}

const brandHandlers = createHandlers(Brand, "Brand");
const categoryHandlers = createHandlers(Category, "Category");

export const getBrands = brandHandlers.list;
export const getBrand = brandHandlers.getOne;
export const createBrand = brandHandlers.create;
export const updateBrand = brandHandlers.update;
export const deleteBrand = brandHandlers.remove;
export const getCategories = categoryHandlers.list;
export const getCategory = categoryHandlers.getOne;
export const createCategory = categoryHandlers.create;
export const updateCategory = categoryHandlers.update;
export const deleteCategory = categoryHandlers.remove;