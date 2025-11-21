/**
 * /src/api/index.js
 * Central API router. Loads all sub-routes.
 */

const express = require('express');
const router = express.Router();

// Properties route
router.use('/properties', require('./properties'));

// Scrape route
router.use('/scrape', require('./scrape'));

module.exports = router;
