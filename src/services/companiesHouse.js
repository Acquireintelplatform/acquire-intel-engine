const axios = require("axios");

const API_KEY = process.env.COMPANIES_HOUSE_API_KEY;

async function getCompany(number) {
  const url = `https://api.companieshouse.gov.uk/company/${number}`;

  const response = await axios.get(url, {
    auth: {
      username: API_KEY,
      password: ""
    }
  });

  return response.data;
}

module.exports = { getCompany };
