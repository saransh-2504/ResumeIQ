import { Router } from "express";
import passport from "passport";
import { generateToken } from "../utils/jwt.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { env } from "../config/env.js";

const router = Router();

// ---- GOOGLE ----
// Step 1: redirect user to Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here with user info
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
  (req, res) => {
    // Generate JWT
    const token = generateToken(req.user._id, req.user.role);

    // Also set cookie as fallback
    res.cookie("token", token, cookieOptions);

    // Pass token in URL so frontend can store in localStorage
    // Frontend reads it on the redirect page and saves to localStorage
    const redirect = req.user.role === "recruiter" ? "/recruiter" : "/dashboard";
    res.redirect(`${env.CLIENT_URL}${redirect}?token=${token}`);
  }
);

// Microsoft OAuth — not configured yet (coming soon)

export default router;
