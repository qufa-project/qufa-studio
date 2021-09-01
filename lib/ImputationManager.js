const axios = require("axios");
const config = require("../configs/config");
const API_URL = config.imputation.baseUrl;
const TOKEN = config.imputation.token;

async function runImputation(fileName) {
  try {
    const result = await axios.default.post(
      `${API_URL}/impute`,
      {
        file_name: fileName,
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

async function runOutlier(fileName) {
  try {
    const result = await axios.default.post(
      `${API_URL}/outlier`,
      {
        file_name: fileName,
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
  runImputation,
  runOutlier,
};
