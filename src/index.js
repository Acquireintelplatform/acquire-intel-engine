import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Create DB connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine + Postgres DB connected 🚀");
});

// Database test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "DB error" });
  }
});

// Simple test route
app.get("/test", (req, res) => {
  res.json({ message: "Raj your backend is working" });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Acquire Intel Engine running on port ${PORT}`);
});
