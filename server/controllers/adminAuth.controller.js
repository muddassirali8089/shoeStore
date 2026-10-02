import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendPasswordResetCode, sendPasswordResetConfirmation } from "../utils/mailer.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codeLifetime = () => Math.max(60, Number.parseInt(process.env.PASSWORD_RESET_CODE_EXPIRY, 10) || 600);
const hashValue = (value) => createHash("sha256").update(`${process.env.JWT_SECRET}:${value}`).digest("hex");

function matchesHash(value, expected) {
  const actualBuffer = Buffer.from(hashValue(value));
  const expectedBuffer = Buffer.from(expected || "");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function adminData(admin) {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role, isActive: admin.isActive };
}

export async function login(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!emailPattern.test(email) || !password) {
      return res.status(400).json({ success: false, message: "A valid email and password are required." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is not configured." });
    }

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !admin.isActive || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }
    const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
    return res.json({ success: true, message: "Admin login successful.", data: { admin: adminData(admin), token } });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ success: false, message: "Unable to log in.", error: error.message });
  }
}

export async function logout(_req, res) {
  return res.json({ success: true, message: "Logged out. Discard the bearer token on the client." });
}

export async function currentAdmin(req, res) {
  return res.json({ success: true, data: adminData(req.admin) });
}

export async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!emailPattern.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "Password recovery is not configured." });
  }

  try {
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.json({ success: true, message: "If an active admin account exists, a verification code has been sent." });
    }

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + codeLifetime() * 1000);
    await PasswordReset.deleteMany({ admin: admin._id });
    await PasswordReset.create({ admin: admin._id, email, codeHash: hashValue(code), expiresAt });
    try {
      await sendPasswordResetCode(email, code, Math.ceil(codeLifetime() / 60));
    } catch (emailError) {
      await PasswordReset.deleteMany({ admin: admin._id });
      console.error("Password reset email could not be sent:", emailError);
    }
    return res.json({ success: true, message: "If an active admin account exists, a verification code has been sent." });
  } catch (error) {
    console.error("Forgot-password request failed:", error);
    return res.status(500).json({ success: false, message: "Unable to process the recovery request." });
  }
}

export async function verifyCode(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const code = String(req.body.code || "");
  if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: "A valid email and 6-digit code are required." });
  }

  try {
    const reset = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
    if (!reset || reset.expiresAt <= new Date() || reset.verifiedAt) {
      return res.status(400).json({ success: false, message: "The code is invalid or expired. Request a new code." });
    }

    const maxAttempts = Math.max(1, Number.parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS, 10) || 5);
    reset.attempts += 1;
    if (!matchesHash(code, reset.codeHash)) {
      if (reset.attempts >= maxAttempts) await reset.deleteOne();
      else await reset.save();
      return res.status(400).json({ success: false, message: "The verification code is incorrect." });
    }

    const resetToken = randomBytes(32).toString("hex");
    reset.codeHash = "used";
    reset.verifiedAt = new Date();
    reset.resetTokenHash = hashValue(resetToken);
    reset.resetTokenExpiresAt = new Date(Date.now() + codeLifetime() * 1000);
    await reset.save();
    return res.json({ success: true, message: "Code verified.", data: { resetToken } });
  } catch (error) {
    console.error("Code verification failed:", error);
    return res.status(500).json({ success: false, message: "Unable to verify the code." });
  }
}

export async function resetPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const newPassword = String(req.body.newPassword || "");
  const resetToken = String(req.body.resetToken || "");
  if (!emailPattern.test(email) || newPassword.length < 8 || !resetToken) {
    return res.status(400).json({ success: false, message: "A valid email, reset token, and password of at least 8 characters are required." });
  }

  try {
    const reset = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
    if (!reset || !reset.verifiedAt || !reset.resetTokenExpiresAt || reset.resetTokenExpiresAt <= new Date() || !matchesHash(resetToken, reset.resetTokenHash)) {
      return res.status(400).json({ success: false, message: "Password reset verification is invalid or expired." });
    }
    const admin = await Admin.findById(reset.admin);
    if (!admin || !admin.isActive) {
      await reset.deleteOne();
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    admin.password = newPassword;
    await admin.save();
    await PasswordReset.deleteMany({ admin: admin._id });
    try {
      await sendPasswordResetConfirmation(email);
    } catch (emailError) {
      console.error("Password reset confirmation email failed:", emailError);
    }
    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return res.status(500).json({ success: false, message: "Unable to reset the password." });
  }
}