import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import { env } from "./config/env.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/health", healthRouter);

export default app;