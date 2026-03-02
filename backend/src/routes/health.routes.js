import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true, message: "ResumeIQ backend is healthy ✅" });
});

export default router;