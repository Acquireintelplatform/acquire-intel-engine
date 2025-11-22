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
    { name: "EGI", fn: fakeScraper }
  ];

  for (const scraper of scrapers) {
    try {
      const data = await scraper.fn();
      results.push({
        source: scraper.name,
        data,
        success: true,
        error: null,
      });
    } catch (err) {
      results.push({
        source: scraper.name,
        data: null,
        success: false,
        error: err.message,
      });
    }
  }

  return results;
}

// ✅ THIS LINE FIXES THE ERROR
export default runAllScrapers;
