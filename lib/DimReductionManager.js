const axios = require("axios");
const config = require("../configs/config");
const API_URL = config.dimReduction.baseUrl;
const TOKEN = config.dimReduction.token;

async function runDimReduction(fileName) {
  try {
    const result = await axios.default.post(
      `${API_URL}/fairness/dim_reduction`,
      {
        file_name: fileName,
        dim: "sex",
      },
      {
        headers: {
          Authorization: `${TOKEN}`,
        },
      }
    );

    return result.data;
  } catch (err) {
    console.error(err);
  }

  return null;
}

module.exports = {
  runDimReduction,
};
