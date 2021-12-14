const axios = require("axios");
const profileConfig = require("../configs/config").profiler;

async function findProfileResult(dataset) {
  try {
    console.log(
      `CALL URL: ${profileConfig.baseUrl}/profile/${dataset.dataTable}`
    );
    const response = await axios.get(
      `${profileConfig.baseUrl}/profile/${dataset.dataTable}`
    );

    return response.data;
  } catch (err) {
    console.error("Exception in findProfileResult >>>>>>>>>>>>>");
    console.error(err);
    return null;
  }
}

module.exports = { findProfileResult };
