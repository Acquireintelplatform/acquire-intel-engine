import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Acquire API is running 🚀" });
});

// Placeholder for AI, scraping, email, dashboards, etc.
// We will add more routes step-by-step.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Acquire API running on port ${PORT}`);
});
