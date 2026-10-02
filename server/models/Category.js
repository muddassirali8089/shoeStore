import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: "", trim: true },
  image: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Draft", "Archived"], default: "Active" },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);