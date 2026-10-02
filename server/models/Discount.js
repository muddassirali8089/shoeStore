import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  name: { type: String, default: "", trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  type: { type: String, enum: ["Percentage", "Fixed amount", "Free shipping"], required: true },
  value: { type: Number, default: 0, min: 0 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ["Active", "Scheduled", "Inactive"], default: "Active", index: true },
  uses: { type: Number, default: 0, min: 0 },
  usageLimit: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export default mongoose.model("Discount", discountSchema);