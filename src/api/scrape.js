// src/api/scrape.js
import express from "express";
import runScrape from "../services/scrape/scrapers.js";

const router = express.Router();

// manual trigger route
router.get("/run", async (req, res) => {
  try {
    const result = await runScrape();
    res.json({ status: "ok", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
