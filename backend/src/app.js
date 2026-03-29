import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js"; // loads OAuth strategies

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import healthRouter from "./routes/health.routes.js";

import settingsRoutes from "./routes/settings.routes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Initialize passport (needed for OAuth strategies)
app.use(passport.initialize());

// Routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth", oauthRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/resume", resumeRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/settings", settingsRoutes);

export default app;
