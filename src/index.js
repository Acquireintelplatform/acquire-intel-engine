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

// Health check
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine + Postgres DB connected 🚀");
});

// Test DB route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed", details: err });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Acquire Intel Engine running on port ${PORT}`));
