import fetch from "node-fetch";
import sicCodes from "./sicCodes.js";
import { delay } from "./helpers.js";

const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const BASE_URL = "https://api.company-information.service.gov.uk";

async function runDailyCompaniesHouseCheck() {
  console.log("🔍 Running daily Companies House distress scan...");
  const results = [];

  for (const sic of sicCodes) {
    console.log(`➡ Checking SIC: ${sic}`);

    await delay(500);

    const url = `${BASE_URL}/advanced-search/companies?sic_codes=${sic}&size=50`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ":").toString("base64")}`,
        },
      });

      const data = await response.json();
      results.push({
        sic,
        total: data?.total_results || 0,
        items: data?.items || [],
      });
    } catch (err) {
      console.error(`❌ Error fetching SIC ${sic}:`, err.message);
    }
  }

  console.log("✅ Daily CH Scan Finished");
  return results;
}

export default runDailyCompaniesHouseCheck;
