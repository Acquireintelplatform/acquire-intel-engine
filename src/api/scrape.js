/**
 * /src/api/scrape.js
 * Route: GET /api/scrape
 * Purpose: Executes the scraper aggregator and returns live results.
 */

const express = require('express');
const router = express.Router();

const { runAllScrapers } = require('../utils/scrapers');

router.get('/', async (req, res) => {
  try {
    const results = await runAllScrapers();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      sourceCount: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Scraper execution failed.'
    });
  }
});

module.exports = router;
