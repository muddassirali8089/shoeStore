import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "store", unique: true },
  storeName: { type: String, default: "ShoeStore", trim: true },
  storeEmail: { type: String, default: "", trim: true },
  currency: { type: String, default: "PKR", trim: true },
  taxRate: { type: Number, default: 0, min: 0 },
  freeShippingThreshold: { type: Number, default: 25000, min: 0 },
  standardShipping: { type: Number, default: 350, min: 0 },
  expressShipping: { type: Number, default: 0, min: 0 },
  processingDays: { type: Number, default: 1, min: 0 },
  maintenanceMode: { type: Boolean, default: false },
  cashOnDeliveryEnabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("StoreSettings", storeSettingsSchema);