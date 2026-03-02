import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.routes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/health", healthRouter);

export default app;