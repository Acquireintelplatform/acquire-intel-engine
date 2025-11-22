import axios from "axios";
import { FBS_SIC_CODES } from "./sicCodes.js";

const BASE_URL = "https://api.company-information.service.gov.uk";

export async function fetchCompanyProfile(companyNumber, apiKey) {
  try {
    const response = await axios.get(
      `${BASE_URL}/company/${companyNumber}`,
      {
        auth: { username: apiKey, password: "" }
      }
    );
    return response.data;
  } catch (err) {
    console.error("❌ Error fetching company profile:", companyNumber, err?.response?.status);
    return null;
  }
}

export function isRelevantSIC(company) {
  if (!company || !company.sic_codes) return false;

  return company.sic_codes.some(code => FBS_SIC_CODES.includes(code));
}

export function detectDistressSignals(company) {
  if (!company) return null;

  const distress = [];

  // 1. Late accounts
  if (company?.accounts?.next_due && company?.accounts?.next_due < new Date().toISOString().split("T")[0]) {
    distress.push("Late filing of accounts");
  }

  // 2. Insolvency
  if (company?.has_insolvency_history === true) {
    distress.push("Insolvency filings detected");
  }

  // 3. Strike-off notices
  if (company?.confirmation_statement?.overdue === true) {
    distress.push("Confirmation statement overdue");
  }

  if (company?.company_status === "dissolved") {
    distress.push("Company dissolved");
  }

  if (company?.company_status === "liquidation") {
    distress.push("Company in liquidation");
  }

  if (company?.company_status === "active" && company?.has_insolvency_history) {
    distress.push("Active but insolvent");
  }

  return distress.length > 0 ? distress : null;
}
