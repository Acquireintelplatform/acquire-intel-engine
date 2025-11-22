// src/api/index.js
// Main API router

const express = require('express');
const router = express.Router();

// Properties routes
const propertiesRouter = require('./properties');
router.use('/properties', propertiesRouter);

// Companies House service
const { getCompany } = require("../services/companiesHouse");

// Companies House API route
router.get("/company/:number", async (req, res) => {
  const number = req.params.number;

  const result = await getCompany(number);

  res.json(result);
});

// Default test route
router.get("/", (req, res) => {
  res.json({ message: "API root working" });
});

module.exports = router;
