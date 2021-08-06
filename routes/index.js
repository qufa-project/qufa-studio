var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "QUFA 통합관리시스템" });
});

module.exports = router;
