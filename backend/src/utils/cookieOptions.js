import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

// Production: SameSite=None + Secure required for cross-domain cookies
// (Vercel frontend → Render backend)
// Development: SameSite=Lax works fine for same-origin localhost
export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
