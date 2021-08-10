var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/new", function (req, res, next) {
  res.render("projects/new", { title: "QUFA 프로젝트 등록" });
});

module.exports = router;
