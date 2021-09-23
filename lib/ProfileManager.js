const axios = require("axios");
const profileConfig = require("../configs/config").profiler;

async function findProfileResult(dataset) {
  try {
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
