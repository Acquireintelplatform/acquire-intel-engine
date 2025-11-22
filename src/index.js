/**
 * Root server file
 * /src/index.js
 */

const express = require("express");
const app = express();

app.use(express.json());

// Import main API router
const apiRouter = require("./api/index");
app.use("/api", apiRouter);

// Root test route
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine + Postgres DB connected 🚀");
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Acquire Intel Engine running on port ${PORT}`);
});
