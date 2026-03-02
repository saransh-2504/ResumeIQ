const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend running");
});
