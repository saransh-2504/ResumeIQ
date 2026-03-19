import crypto from "crypto";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { cookieOptions } from "../utils/cookieOptions.js";

// ---- SIGNUP ----
export async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Recruiters must use company email (no gmail)
    if (role === "recruiter" && email.includes("@gmail.com")) {
      return res.status(400).json({
        message: "Recruiters must use a company email, not Gmail.",
      });
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

// ---- VERIFY EMAIL ----
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
    await user.save();

    // Auto-login: generate JWT and set cookie
    const jwtToken = generateToken(user._id, user.role);
    res.cookie("token", jwtToken, cookieOptions);

    res.status(200).json({
      message: "Email verified successfully.",
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

// ---- LOGIN ----
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

    // Generate JWT and set in cookie
    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful.",
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

// ---- LOGOUT ----
export async function logout(req, res) {
  // Clear the cookie
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Logged out successfully." });
}

// ---- GET CURRENT USER (me) ----
// Used on app load to check if user is still logged in
export async function getMe(req, res) {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved,
    },
  });
}

// ---- OAUTH LOGIN/SIGNUP ----
// Called after OAuth provider returns user info
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

    // Generate JWT and set cookie
    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "OAuth login successful.",
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
