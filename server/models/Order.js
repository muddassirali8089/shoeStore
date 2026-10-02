import mongoose from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  brand: { type: String, default: "" },
  image: { type: String, default: "" },
  size: { type: Number, required: true, min: 0.1 },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true, default: "" },
  },
  shippingAddress: {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "An order must contain at least one item."] },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  discountCode: { type: String, default: "" },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["cash_on_delivery"], default: "cash_on_delivery" },
  paymentStatus: { type: String, enum: ["pending", "received"], default: "pending", index: true },
  orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
  orderNotes: { type: String, default: "", trim: true },
  inventoryRestored: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);