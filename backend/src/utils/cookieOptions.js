import { env } from "../config/env.js";

// Secure cookie settings for JWT
// httpOnly = JS can't read it (XSS protection)
// secure = only sent over HTTPS in production
// sameSite = CSRF protection
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
