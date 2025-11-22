/**
 * /src/utils/egi.js
 * EGI placeholder scraper (CommonJS version)
 */

const axios = require("axios");
const cheerio = require("cheerio");

async function egiScraper() {
  try {
    const url = "https://www.egi.co.uk/property-listings/"; // placeholder
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const listings = [];

    // Placeholder logic
    $("div.property-item").each((i, el) => {
      listings.push({
        title: $(el).find(".property-title").text().trim(),
        link: $(el).find("a").attr("href"),
        source: "EGI"
      });
    });

    return listings;
  } catch (err) {
    console.error("EGI scraper error:", err.message);
    return [];
  }
}

module.exports = egiScraper;
