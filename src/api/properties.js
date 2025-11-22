/**
 * /src/api/properties.js
 * Properties API routes
 */

const express = require('express');
const router = express.Router();

// Example route
router.get("/", (req, res) => {
  res.json({ message: "Properties endpoint working" });
});

module.exports = router;
