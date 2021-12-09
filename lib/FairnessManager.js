const axios = require("axios");
const config = require("../configs/config");

const API_URL = config.fairness.baseUrl;
const TOKEN = config.fairness.token;

// /api/fa/health?key=cHJvbXB0ZWNo
async function runFairness(dataset) {
  const fDomain = dataset.getFairnessDomain();

  try {
    const result = await axios.default.get(
      `${API_URL}/api/fa/${fDomain}?key=${TOKEN}`
    );

    return result.data;
  } catch (err) {
    console.error(err);
  }

  return null;
}

module.exports = {
  runFairness,
};
