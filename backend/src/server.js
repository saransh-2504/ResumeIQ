import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  try {
    await connectDB(); // 🔥 DB wiring here

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();