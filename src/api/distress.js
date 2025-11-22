// src/api/distress.js
import express from "express";
import runDailyCompaniesHouseCheck from "../distress/dailyCompaniesHouse.js";

const router = express.Router();

router.get("/run", async (req, res) => {
  try {
    const result = await runDailyCompaniesHouseCheck();
    res.json({ status: "ok", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
