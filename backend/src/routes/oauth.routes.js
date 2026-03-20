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
    // Generate JWT and set cookie
    const token = generateToken(req.user._id, req.user.role);
    res.cookie("token", token, cookieOptions);

    // Redirect to correct dashboard
    const redirect = req.user.role === "recruiter" ? "/recruiter" : "/dashboard";
    res.redirect(`${env.CLIENT_URL}${redirect}`);
  }
);

// Microsoft OAuth — not configured yet (coming soon)

export default router;
