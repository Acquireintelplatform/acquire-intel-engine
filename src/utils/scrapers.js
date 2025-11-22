/**
 * /src/utils/scrapers.js
 * Aggregates and runs all scrapers in sequence.
 */

// Placeholder scraper until real scrapers are added
async function fakeScraper() {
  return [{ message: "EGI scraper placeholder working" }];
}

/**
 * Runs all scrapers safely.
 * Returns an array of { source, data, success, error }
 */
async function runAllScrapers() {
  const results = [];

  // List all scraper functions here
  const scrapers = [
    { name: 'EGI', fn: fakeScraper }
  ];

  for (const scraper of scrapers) {
    try {
      const data = await scraper.fn();
      results.push({
        source: scraper.name,
        success: true,
        data
      });
    } catch (err) {
      results.push({
        source: scraper.name,
        success: false,
        error: err.message || 'Unknown scraper error'
      });
    }
  }

  return results;
}

module.exports = {
  runAllScrapers
};
