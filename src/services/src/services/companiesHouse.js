// src/services/companiesHouse.js

const axios = require("axios");

async function getCompany(companyNumber) {
  try {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

    const response = await axios.get(
      `https://api.company-information.service.gov.uk/company/${companyNumber}`,
      {
        auth: {
          username: apiKey,
          password: ""
        }
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (err) {
    console.error("Companies House API error:", err.response?.data || err.message);
    return {
      success: false,
      error: "Companies House lookup failed"
    };
  }
}

module.exports = {
  getCompany
};
