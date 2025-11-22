import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fetchCompanyProfile, isRelevantSIC, detectDistressSignals } from "./helpers.js";

const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;

// Folder for saving daily results
const RESULTS_DIR = path.resolve("distress_results");

// Make sure the folder exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function scanCompaniesHouse() {
  console.log("🔍 Distress Engine: Daily scan started...");

  // Example batch of known operator company numbers
  // (We will replace these with auto-scraped lists later)
  const COMPANY_NUMBERS = [
    "00002515", // Tesco
    "SC090302", // Nando’s example Scotland company
    "05203559", // Pizza Hut example
  ];

  const results = [];

  for (const number of COMPANY_NUMBERS) {
    const company = await fetchCompanyProfile(number, COMPANIES_HOUSE_API_KEY);
    if (!company) continue;

    // Only track companies with relevant F&B or leisure SIC codes
    if (!isRelevantSIC(company)) continue;

    const distress = detectDistressSignals(company);
    if (distress) {
      results.push({
        companyNumber: number,
        name: company.company_name,
        distressSignals: distress,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // Save the output in a daily dated file
  const filename = `distress_${new Date().toISOString().split("T")[0]}.json`;
  const filepath = path.join(RESULTS_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

  console.log(`✅ Distress scan complete. Saved to ${filepath}`);
}

// Runs every day at 6am (London time)
cron.schedule("0 6 * * *", async () => {
  await scanCompaniesHouse();
});

console.log("⏳ Distress Engine cron job loaded (runs daily at 6am)");
