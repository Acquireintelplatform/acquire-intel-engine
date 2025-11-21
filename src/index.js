/**
 * /src/index.js
 * Main server entry point
 */

const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Mount API routes
const apiRouter = require('./api');
app.use('/api', apiRouter);

// Health check
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine + Postgres DB connected 🚀");
});

// DB test route
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
app.get("/test
