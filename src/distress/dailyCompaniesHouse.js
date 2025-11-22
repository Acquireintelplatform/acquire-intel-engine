import fetch from "node-fetch";
import sicCodes from "./sicCodes.js";
import { delay } from "./helpers.js";

const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const BASE_URL = "https://api.company-information.service.gov.uk";

// =======================================================
// MAIN FUNCTION — this is what server.js imports
// =======================================================
async function runDailyCompaniesHouseCheck() {
  console.log("🔍 Running daily Companies House distress scan...");

  const results = [];

  for (const sic of sicCodes) {
    console.log(`📌 Checking SIC: ${sic}`);

    await delay(500);

    const url = `${BASE_URL}/advanced-search/companies?sic_codes=${sic}&size=50`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ":").toString("base64")}`,
        },
      });

      const data = await response.json();

      if (data && data.items) {
        data.items.forEach((company) => {
          // Basic distress indicators
          const distress = {
            name: company.company_name,
            number: company.company_number,
            status: company.company_status,
            sic_codes: company.sic_codes ?? [],
            last_accounts: company.accounts?.next_due ?? null,
            type: company.type,
          };

          results.push(distress);
        });
      }
    } catch (err) {
      console.error(`❌ Error fetching SIC ${sic}`, err.message);
    }
  }

  console.log("✅ Companies House scan completed.");
  return results;
}

// =======================================================
// DEFAULT EXPORT (this was missing before)
// =======================================================
export default runDailyCompaniesHouseCheck;
