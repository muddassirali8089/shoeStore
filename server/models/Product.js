import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: { type: Number, required: true, min: 0.1 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  gender: { type: String, enum: ["Men", "Women", "Unisex"], default: "Unisex" },
  condition: { type: String, required: true, enum: ["BrandNew", "Premium 10/10", "Excellent 9/10", "Good 8/10", "Used 7/10"] },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 1 },
  originalPrice: { type: Number, min: 0, default: 0 },
  discount: { type: Number, min: 0, max: 100, default: 0 },
  images: { type: [String], required: true, validate: [(images) => images.length >= 1 && images.length <= 4, "Products require 1 to 4 image URLs."] },
  sizes: {
    type: [sizeSchema],
    required: true,
    validate: [(sizes) => sizes.length > 0 && new Set(sizes.map(({ size }) => size)).size === sizes.length, "Add one or more unique shoe sizes."],
  },
  colors: { type: [String], default: [] },
  features: { type: [String], default: [] },
  status: { type: String, enum: ["Active", "Draft", "Archived"], default: "Active", index: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewsCount: { type: Number, min: 0, default: 0 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.index({ name: "text", condition: 1, price: 1 });
productSchema.virtual("totalStock").get(function totalStock() {
  return (this.sizes || []).reduce((total, size) => total + size.quantity, 0);
});
productSchema.virtual("stock").get(function stock() {
  return this.totalStock;
});
productSchema.virtual("thumbnail").get(function thumbnail() {
  return this.images[0] || "";
});

export default mongoose.model("Product", productSchema);