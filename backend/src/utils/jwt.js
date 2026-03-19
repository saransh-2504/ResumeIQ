import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Generate a JWT token with user id and role inside
export function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Verify a token and return the decoded payload
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
