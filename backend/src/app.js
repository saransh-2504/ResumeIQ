import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import healthRouter from "./routes/health.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import communityRoutes from "./routes/community.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.set("trust proxy", 1);

//  Rate limiting 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Sanitize MongoDB queries (prevent injection) 
app.use(mongoSanitize());

app.use(passport.initialize());

// Routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/auth", oauthRoutes);
app.use("/api/v1/jobs", generalLimiter, jobRoutes);
app.use("/api/v1/admin", generalLimiter, adminRoutes);
app.use("/api/v1/resume", generalLimiter, resumeRoutes);
app.use("/api/v1/applications", generalLimiter, applicationRoutes);
app.use("/api/v1/settings", generalLimiter, settingsRoutes);
app.use("/api/v1/community", generalLimiter, communityRoutes);
app.use("/api/v1/notifications", generalLimiter, notificationRoutes);

export default app;
