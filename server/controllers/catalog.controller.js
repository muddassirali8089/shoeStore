import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const conditions = ["BrandNew", "Premium 10/10", "Excellent 9/10", "Good 8/10", "Used 7/10"];
const productStatuses = ["Active", "Draft", "Archived"];

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendError(res, error, fallback) {
  console.error("Catalog request failed:", error);
  const status = error.statusCode || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? "A record with this name already exists." : error.name === "ValidationError" ? "Validation failed." : status >= 500 ? fallback : error.message;
  return res.status(status).json({
    success: false,
    message,
    ...(error.name === "ValidationError" ? { errors: Object.values(error.errors).map(({ path, message: detail }) => ({ field: path, message: detail })) } : {}),
    ...(status >= 500 && process.env.NODE_ENV !== "production" ? { error: error.message } : {}),
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArray(value, field, delimiter = ",") {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") throw fail(400, `${field} must be an array.`);
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    if (value.trim().startsWith("[")) throw fail(400, `${field} must be valid JSON array data.`);
    return value.split(delimiter).map((item) => item.trim()).filter(Boolean);
  }
}

function parseSizes(value) {
  const sizes = parseArray(value, "sizes");
  if (!sizes) return undefined;
  if (!sizes.length) throw fail(400, "Add at least one shoe size and quantity.");
  const parsed = sizes.map((entry) => ({ size: Number(entry?.size), quantity: Number(entry?.quantity) }));
  if (parsed.some(({ size, quantity }) => !Number.isFinite(size) || size <= 0 || !Number.isInteger(quantity) || quantity < 0)) {
    throw fail(400, "Each size must be numeric and have a non-negative whole-number quantity.");
  }
  if (new Set(parsed.map(({ size }) => size)).size !== parsed.length) throw fail(400, "Duplicate shoe sizes are not allowed.");
  return parsed.sort((left, right) => left.size - right.size);
}

function booleanValue(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (["true", "1", "on"].includes(String(value).toLowerCase())) return true;
  if (["false", "0", "off", ""].includes(String(value).toLowerCase())) return false;
  throw fail(400, "Boolean fields must be true or false.");
}

async function resolveReference(Model, value, label) {
  if (!value) throw fail(400, `${label} is required.`);
  const record = mongoose.isValidObjectId(value)
    ? await Model.findById(value)
    : await Model.findOne({ name: new RegExp(`^${escapeRegex(String(value).trim())}$`, "i") });
  if (!record || record.status !== "Active") throw fail(400, `A valid active ${label.toLowerCase()} is required.`);
  return record;
}

function parsePrice(value, label, allowZero = false) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < (allowZero ? 0 : 1)) throw fail(400, `${label} must be a valid ${allowZero ? "non-negative" : "positive"} number.`);
  return price;
}

async function populateProduct(product) {
  return product.populate("brand category");
}

export async function createProduct(req, res) {
  const uploadedImages = [];
  try {
    const { name, condition, description } = req.body;
    if (!String(name || "").trim()) throw fail(400, "Product name is required.");
    if (!conditions.includes(condition)) throw fail(400, "Product condition is invalid.");
    if (!String(description || "").trim()) throw fail(400, "Product description is required.");
    if (!req.files?.length) throw fail(400, "Upload at least one product image.");
    if (req.files.length > 4) throw fail(400, "Maximum 4 product images are allowed.");

    const [brand, category] = await Promise.all([
      resolveReference(Brand, req.body.brand, "Brand"),
      resolveReference(Category, req.body.category, "Category"),
    ]);
    const price = parsePrice(req.body.price, "Price");
    const originalPrice = req.body.originalPrice === undefined || req.body.originalPrice === ""
      ? price
      : parsePrice(req.body.originalPrice, "Original price", true);
    const sizes = parseSizes(req.body.sizes);
    if (!sizes) throw fail(400, "Add at least one shoe size and quantity.");

    const { uploadImage, isCloudinaryConfigured } = await import("../config/cloudinary.js");
    if (!isCloudinaryConfigured()) throw fail(503, "Cloudinary is not configured.");
    for (const file of req.files) uploadedImages.push(await uploadImage(file, "shoestore/products"));

    const product = await Product.create({
      name: String(name).trim(), brand: brand._id, category: category._id,
      gender: req.body.gender || "Unisex", condition, description: String(description).trim(),
      price, originalPrice,
      discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
      images: uploadedImages, sizes,
      colors: parseArray(req.body.colors, "colors") || [],
      features: parseArray(req.body.features, "features", "\n") || [],
      status: req.body.status || "Active",
      rating: req.body.rating === undefined ? 0 : parsePrice(req.body.rating, "Rating", true),
      reviewsCount: req.body.reviewsCount === undefined ? 0 : parsePrice(req.body.reviewsCount, "Reviews count", true),
      featured: booleanValue(req.body.featured),
      bestseller: booleanValue(req.body.bestseller),
      newArrival: booleanValue(req.body.newArrival),
    });
    return res.status(201).json({ success: true, message: "Product created successfully.", data: await populateProduct(product) });
  } catch (error) {
    if (uploadedImages.length) {
      const { deleteImageByUrl } = await import("../config/cloudinary.js");
      await Promise.allSettled(uploadedImages.map(deleteImageByUrl));
    }
    return sendError(res, error, "Unable to create product.");
  }
}

export async function getProducts(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const filter = req.admin ? {} : { status: "Active" };
    if (req.admin && req.query.status) {
      if (!productStatuses.includes(req.query.status)) throw fail(400, "Product status is invalid.");
      filter.status = req.query.status;
    }
    if (req.query.condition) {
      if (!conditions.includes(req.query.condition)) throw fail(400, "Product condition is invalid.");
      filter.condition = req.query.condition;
    }
    if (req.query.gender) filter.gender = req.query.gender;

    for (const [queryKey, Model, field] of [["brand", Brand, "brand"], ["category", Category, "category"]]) {
      if (!req.query[queryKey]) continue;
      const reference = await resolveReference(Model, req.query[queryKey], queryKey);
      filter[field] = reference._id;
    }

    if (req.query.size !== undefined) {
      const size = Number(req.query.size);
      if (!Number.isFinite(size) || size <= 0) throw fail(400, "Size must be a positive number.");
      filter.sizes = { $elemMatch: { size, quantity: { $gt: 0 } } };
    }
    const minPrice = req.query.minPrice === undefined ? undefined : parsePrice(req.query.minPrice, "Minimum price", true);
    const maxPrice = req.query.maxPrice === undefined ? undefined : parsePrice(req.query.maxPrice, "Maximum price", true);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw fail(400, "Minimum price cannot exceed maximum price.");
    }
    const stock = String(req.query.stock || "").toLowerCase();
    if (["in-stock", "in_stock"].includes(stock)) filter.sizes = { $elemMatch: { quantity: { $gt: 0 } } };
    if (stock === "low-stock" || stock === "low_stock") filter.sizes = { $elemMatch: { quantity: { $gt: 0, $lte: 5 } } };
    if (["out-of-stock", "out_of_stock"].includes(stock)) filter.sizes = { $not: { $elemMatch: { quantity: { $gt: 0 } } } };

    const search = String(req.query.search || "").trim();
    if (search) {
      const [matchingBrands, matchingCategories] = await Promise.all([
        Brand.find({ name: new RegExp(escapeRegex(search), "i"), status: "Active" }).select("_id"),
        Category.find({ name: new RegExp(escapeRegex(search), "i"), status: "Active" }).select("_id"),
      ]);
      filter.$or = [
        { name: new RegExp(escapeRegex(search), "i") },
        { brand: { $in: matchingBrands.map(({ _id }) => _id) } },
        { category: { $in: matchingCategories.map(({ _id }) => _id) } },
      ];
    }

    const sortOptions = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, priceAsc: { price: 1 }, priceDesc: { price: -1 }, nameAsc: { name: 1 } };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).populate("brand category").sort(sort).skip((page - 1) * limit).limit(limit),
    ]);
    return res.json({ success: true, data: products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return sendError(res, error, "Unable to load products.");
  }
}

export async function getProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid product ID.");
    const filter = { _id: req.params.id };
    if (!req.admin) filter.status = "Active";
    const product = await Product.findOne(filter).populate("brand category");
    if (!product) throw fail(404, "Product not found.");
    return res.json({ success: true, data: product });
  } catch (error) {
    return sendError(res, error, "Unable to load product.");
  }
}

export async function updateProduct(req, res) {
  const uploadedImages = [];
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid product ID.");
    const product = await Product.findById(req.params.id);
    if (!product) throw fail(404, "Product not found.");
    const body = req.body;
    const updates = {};

    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw fail(400, "Product name is required.");
      updates.name = String(body.name).trim();
    }
    if (body.brand !== undefined) updates.brand = (await resolveReference(Brand, body.brand, "Brand"))._id;
    if (body.category !== undefined) updates.category = (await resolveReference(Category, body.category, "Category"))._id;
    if (body.gender !== undefined) updates.gender = body.gender;
    if (body.condition !== undefined) {
      if (!conditions.includes(body.condition)) throw fail(400, "Product condition is invalid.");
      updates.condition = body.condition;
    }
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.price !== undefined) updates.price = parsePrice(body.price, "Price");
    if (body.originalPrice !== undefined) updates.originalPrice = parsePrice(body.originalPrice, "Original price", true);
    if (body.sizes !== undefined) updates.sizes = parseSizes(body.sizes);
    if (body.colors !== undefined) updates.colors = parseArray(body.colors, "colors");
    if (body.features !== undefined) updates.features = parseArray(body.features, "features", "\n");
    if (body.status !== undefined) {
      if (!productStatuses.includes(body.status)) throw fail(400, "Product status is invalid.");
      updates.status = body.status;
    }
    for (const field of ["featured", "bestseller", "newArrival"]) {
      if (body[field] !== undefined) updates[field] = booleanValue(body[field]);
    }
    if (body.rating !== undefined) {
      updates.rating = parsePrice(body.rating, "Rating", true);
      if (updates.rating > 5) throw fail(400, "Rating cannot exceed 5.");
    }

    const oldImages = [...product.images];
    let finalImages = oldImages;
    if (body.retainedImages !== undefined) {
      const retainedImages = parseArray(body.retainedImages, "retainedImages");
      if (retainedImages.some((url) => !oldImages.includes(url))) throw fail(400, "Only existing product image URLs can be retained.");
      finalImages = retainedImages;
    }
    if (req.files?.length) {
      if (!await import("../config/cloudinary.js").then(({ isCloudinaryConfigured }) => isCloudinaryConfigured())) {
        throw fail(503, "Cloudinary is not configured.");
      }
      const { uploadImage } = await import("../config/cloudinary.js");
      for (const file of req.files) uploadedImages.push(await uploadImage(file, "shoestore/products"));
      if (body.retainedImages === undefined) finalImages = [];
      finalImages = [...finalImages, ...uploadedImages];
    }
    if (finalImages.length < 1 || finalImages.length > 4) throw fail(400, "A product must have between 1 and 4 images.");
    updates.images = finalImages;
    const finalPrice = updates.price ?? product.price;
    const finalOriginalPrice = updates.originalPrice ?? product.originalPrice;
    updates.discount = finalOriginalPrice > finalPrice ? Math.round((1 - finalPrice / finalOriginalPrice) * 100) : 0;

    Object.assign(product, updates);
    await product.save();
    const removedImages = oldImages.filter((url) => !finalImages.includes(url));
    if (removedImages.length) {
      const { deleteImageByUrl } = await import("../config/cloudinary.js");
      const cleanup = await Promise.allSettled(removedImages.map(deleteImageByUrl));
      cleanup.filter(({ status }) => status === "rejected").forEach(({ reason }) => console.error("Removed product image cleanup failed:", reason));
    }
    return res.json({ success: true, message: "Product updated successfully.", data: await populateProduct(product) });
  } catch (error) {
    if (uploadedImages.length) {
      const { deleteImageByUrl } = await import("../config/cloudinary.js");
      await Promise.allSettled(uploadedImages.map(deleteImageByUrl));
    }
    return sendError(res, error, "Unable to update product.");
  }
}

export async function deleteProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(400, "Invalid product ID.");
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw fail(404, "Product not found.");
    const { deleteImageByUrl } = await import("../config/cloudinary.js");
    const cleanup = await Promise.allSettled(product.images.map(deleteImageByUrl));
    cleanup.filter(({ status }) => status === "rejected").forEach(({ reason }) => console.error("Deleted product image cleanup failed:", reason));
    return res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    return sendError(res, error, "Unable to delete product.");
  }
}
