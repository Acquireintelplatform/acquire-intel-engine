// src/api/properties.js

import express from "express";
import { getProperties } from "../services/properties.js";

const router = express.Router();

// GET /api/properties
router.get("/", async (req, res) => {
  try {
    const data = await getProperties();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in GET /api/properties:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
