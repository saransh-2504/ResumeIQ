import crypto from "crypto";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
import { cookieOptions } from "../utils/cookieOptions.js";

// SIGNUP 
export async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Recruiters must use company email (no personal/student emails)
    const BLOCKED_RECRUITER_DOMAINS = [
      "gmail.com", "yahoo.com", "yahoo.in", "hotmail.com", "outlook.com",
      "live.com", "icloud.com", "protonmail.com", "rediffmail.com",
      "ymail.com", "aol.com"
    ];
    if (role === "recruiter") {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (!emailDomain || BLOCKED_RECRUITER_DOMAINS.includes(emailDomain)) {
        return res.status(400).json({
          message: "Recruiters must use a company email address. Personal email providers (Gmail, Yahoo, Outlook etc.) are not allowed.",
        });
      }
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate a random token for email verification
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user (password gets hashed in model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || "candidate",
      verificationToken,
      // Recruiters start as not approved
      isApproved: role === "recruiter" ? false : true,
    });

    // Send verification email (don't crash if email fails in dev)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
      // In dev: log the verify link so you can test without email
      console.log(`\n🔗 VERIFY LINK (use this in browser):\n${process.env.CLIENT_URL}/verify-email?token=${verificationToken}\n`);
    }

    res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error during signup." });
  }
}

// VERIFY EMAIL 
export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token missing." });
    }

    // Find user with this token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    // Mark as verified and clear the token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.unverifiedExpiresAt = null; // disable TTL — user is now verified
    await user.save();

    // Auto-login: generate JWT and set cookie + return in body
    const jwtToken = generateToken(user._id, user.role);
    res.cookie("token", jwtToken, cookieOptions);

    res.status(200).json({
      message: "Email verified successfully.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("Verify email error:", err.message);
    res.status(500).json({ message: "Server error during verification." });
  }
}

// LOGIN 
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // OAuth users can't login with password
    if (user.oauthProvider) {
      return res.status(400).json({
        message: `This account uses ${user.oauthProvider} login. Please use that instead.`,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Must verify email first
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    // Generate JWT and set in cookie + return in body for cross-domain
    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
}

// LOGOUT
export async function logout(req, res) {
  // Clear the cookie — don't pass maxAge when clearing
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" });
  res.status(200).json({ message: "Logged out successfully." });
}

// GET CURRENT USER (me) 
export async function getMe(req, res) {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved,
      profileSetupDone: req.user.profileSetupDone || false,
      avatar: req.user.avatar || null,
    },
  });
}

// FORGOT PASSWORD 
// User submits their email — we send a reset link
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });

    // Always return success — don't reveal if email exists (security)
    if (!user || user.oauthProvider) {
      return res.status(200).json({ message: "If this email exists, a reset link has been sent." });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store hashed version in DB (never store plain token)
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email with plain token (user clicks link, we hash and compare)
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Failed to send reset email." });
  }
}

// RESET PASSWORD 
// User clicks link in email, submits new password
export async function resetPassword(req, res) {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Hash the token from URL and compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Set new password — pre-save hook will hash it
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now login." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ message: "Failed to reset password." });
  }
}

// RESEND VERIFICATION EMAIL 
export async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success — don't reveal if email exists
    if (!user || user.isVerified) {
      return res.status(200).json({ message: "If this email exists and is unverified, a new link has been sent." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.unverifiedExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // reset 1h window
    await user.save();

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error("Resend verification email failed:", e.message);
    }

    res.status(200).json({ message: "Verification email resent." });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend verification." });
  }
}
export async function oauthLogin(req, res) {
  try {
    const { name, email, oauthProvider, oauthId } = req.body;

    if (!email || !oauthProvider || !oauthId) {
      return res.status(400).json({ message: "OAuth data incomplete." });
    }

    // Recruiters cannot use OAuth
    // (We check this on frontend too, but double-check here)
    // If someone tries to OAuth with a recruiter account, block it
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.role === "recruiter") {
      return res.status(403).json({
        message: "Recruiters must login with company email and password.",
      });
    }

    let user = existingUser;

    if (!user) {
      // New user via OAuth — create with candidate role
      user = await User.create({
        name,
        email,
        oauthProvider,
        oauthId,
        role: "candidate",
        isVerified: true, // OAuth emails are already verified
        isApproved: true,
      });
    }

    // Generate JWT and set cookie + return in body
    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "OAuth login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("OAuth login error:", err.message);
    res.status(500).json({ message: "Server error during OAuth login." });
  }
}
