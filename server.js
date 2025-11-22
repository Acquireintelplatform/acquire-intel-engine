import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ========================
// IMPORT API ROUTES
// ========================
import propertiesRoutes from "./src/api/properties.js";
import scrapeRoutes from "./src/api/scrape.js";
import distressRoutes from "./src/api/distress.js";

app.use("/api/properties", propertiesRoutes);
app.use("/api/scrape", scrapeRoutes);

// ⭐ ADDING THE DISTRESS ENGINE API ROUTE
app.use("/api/distress", distressRoutes);

// ========================
// DAILY CRON JOB (08:00 UK time, GMT or BST handled by Render)
// ========================
import runDailyCompaniesHouseCheck from "./src/distress/dailyCompaniesHouse.js";

cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("⏳ Running daily Companies House distress scan (cron)...");
    try {
      await runDailyCompaniesHouseCheck();
      console.log("✅ Daily distress scan completed");
    } catch (err) {
      console.error("❌ Error during distress cron job:", err.message);
    }
  },
  {
    timezone: "Europe/London",
  }
);

// ========================
// ROOT CHECK
// ========================
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine backend is running.");
});

// ========================
// START SERVER
// ========================
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
