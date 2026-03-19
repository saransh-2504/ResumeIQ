import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import healthRouter from "./routes/health.routes.js";

const app = express();

// Allow frontend to send cookies
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // needed for cookies to work cross-origin
  })
);

// Parse JSON body
app.use(express.json());

// Parse cookies (needed to read JWT from cookie)
app.use(cookieParser());

// Routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/admin", adminRoutes);

export default app;
