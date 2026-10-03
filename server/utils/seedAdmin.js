import Admin from "../models/Admin.js";

export async function seedAdmin() {
  console.log("Seeding initial admin account...");
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("Admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin.");
    return;
  }
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");

  const exists = await Admin.exists({ email });
  if (!exists) {
    await Admin.create({ name: process.env.ADMIN_NAME || "Store Admin", email, password });
    console.log("Initial admin account created.");
  }
}