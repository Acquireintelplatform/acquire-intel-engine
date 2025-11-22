// src/api/scrape.js
import express from "express";

const router = express.Router();

// Example placeholder route
router.get("/", (req, res) => {
  res.json({ message: "Scrape API OK" });
});

export default router;
