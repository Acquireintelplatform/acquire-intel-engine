// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================================
// IMPORT API ROUTES
// =======================================

import propertiesRoutes from "./src/api/properties.js";
import scrapeRoutes from "./src/api/scrape.js";
import distressRoutes from "./src/api/distress.js";

// Mount API routes
app.use("/api/properties", propertiesRoutes);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/distress", distressRoutes);

// =======================================
// DAILY CRON JOB (08:00 UK time)
// =======================================

import runDailyCompaniesHouseCheck from "./src/distress/dailyCompaniesHouse.js";

cron.schedule("0 8 * * *", async () => {
  console.log("Running scheduled Companies House distress scan...");
  try {
    await runDailyCompaniesHouseCheck();
    console.log("Daily distress scan completed.");
  } catch (err) {
    console.error("Daily distress scan failed:", err.message);
  }
});

// =======================================
// START SERVER
// =======================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
