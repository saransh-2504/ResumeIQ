import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

// Accepts JWT from cookie OR Authorization header (Bearer token)
// Header takes priority — used in production cross-domain setup
export async function authMiddleware(req, res, next) {
  try {
    // Try Authorization header first (production cross-domain)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // Fallback to cookie (local dev)
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please login." });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
