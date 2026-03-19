import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

// Reads JWT from cookie, verifies it, attaches user to req
export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please login." });
    }

    // Decode the token
    const decoded = verifyToken(token);

    // Fetch user from DB (to get latest role/approval status)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Attach user to request so controllers can use it
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
