import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
	const token = req.headers.authorization?.startsWith("Bearer ")
		? req.headers.authorization.slice(7)
		: null;

	if (!token) {
		return res.status(401).json({ success: false, message: "Admin authentication is required." });
	}
	if (!process.env.JWT_SECRET) {
		return res.status(500).json({ success: false, message: "JWT_SECRET is not configured." });
	}

	let payload;
	try {
		payload = jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		console.error("Admin token verification failed:", error.message);
		return res.status(401).json({ success: false, message: "Invalid or expired admin token." });
	}

	if (payload.purpose) {
		return res.status(401).json({ success: false, message: "Invalid admin access token." });
	}

	try {
		const admin = await Admin.findById(payload.sub).select("name email role isActive");
		if (!admin || !admin.isActive) {
			return res.status(401).json({ success: false, message: "Admin account is unavailable." });
		}
		req.admin = admin;
		return next();
	} catch (error) {
		console.error("Admin lookup failed:", error);
		return res.status(500).json({ success: false, message: "Unable to verify admin account." });
	}
}
