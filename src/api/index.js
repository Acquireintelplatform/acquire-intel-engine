/**
 * /src/api/index.js
 * Main API router
 */

const express = require("express");
const router = express.Router();

// Properties routes
const propertiesRouter = require("./properties.js");
router.use("/properties", propertiesRouter);

// Companies House service
const { getCompany } = require("../services/companiesHouse.js");

// Companies House API route
router.get("/company/:number", async (req, res) => {
  try {
    const number = req.params.number;
    const result = await getCompany(number);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Companies House lookup failed",
      details: err.message
    });
  }
});

// Default test route
router.get("/", (req, res) => {
  res.json({ message: "API root working" });
});

module.exports = router;
