var express = require("express");
var router = express.Router();

const DataManager = require("../lib/DataManager");

const formatBytes = function (bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  const pageOption = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage,
  };

  const data = await DataManager.findAll(pageOption);

  pageOption.currentPage = parseInt(pageOption.currentPage);
  pageOption.total = Math.ceil(data.count / pageOption.perPage);
  pageOption.path = req.path;
  pageOption.query = req.query;

  console.log(pageOption);

  res.render("index", {
    title: "QUFA 통합관리시스템",
    data,
    dataStatus: DataManager.DATA_STATUS,
    pageOption,
    formatBytes,
  });
});

module.exports = router;
