import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

// Load environment variables
dotenv.config();

import distressRoutes from "./src/api/distress.js";
import "./src/distress/dailyCompaniesHouse.js"; 
// ⬆ This line activates the daily cron job automatically

const app = express();
app.use(cors());
app.use(express.json());

// Basic health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Distress scan routes
app.use("/distress", distressRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
