var express = require("express");
var router = express.Router();

const DataManager = require("../lib/DataManager");
const RawDataManager = require("../lib/RawDataManager");

/* GET home page. */
router.get("/new", function (req, res, next) {
  res.render("projects/new", { title: "QUFA 프로젝트 등록" });
});

router.get("/:id", async function (req, res, next) {
  const data = await DataManager.findWithMeta(req.params.id);
  res.render("projects/show", { title: "QUFA 프로젝트 등록", data });
});

module.exports = router;
