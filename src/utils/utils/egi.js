// src/utils/utils/egi.js

import axios from "axios";
import * as cheerio from "cheerio";

/*
  EGI SCRAPER MODULE
  ------------------
  This module will fetch live listings from EG Propertylink (EGI).
  Structure only — logic added later.
*/

export const fetchEGIListings = async () => {
  try {
    // Placeholder URL (requires your real EGI search page)
    const url = "https://www.egi.co.uk/property-listings/";

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Placeholder extraction
    const listings = [];

    $("div.property-item").each((i, el) => {
      listings.push({
        title: $(el).find(".property-title").text().trim(),
        location: $(el).find(".property-location").text().trim(),
        size: $(el).find(".property-size").text().trim(),
        link: $(el).find("a").attr("href"),
        source: "EGI"
      });
    });

    return listings;
  } catch (err) {
    console.error("EGI scraper error:", err);
    return [];
  }
};
