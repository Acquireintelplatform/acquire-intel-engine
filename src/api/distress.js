import express from "express";

const router = express.Router();

// Test endpoint so the route works
router.get("/", (req, res) => {
  res.json({ message: "Distress API OK" });
});

export default router;
