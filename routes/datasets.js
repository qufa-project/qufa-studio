var express = require("express");
var router = express.Router();
var multer = require("multer");
const axios = require("axios");

router.post("/", upload.single("file"), async function (req, res, next) {
  try {
    const reqBody = req.body;
    const parseOption = JSON.parse(reqBody.parseOption);
    const meta = JSON.parse(reqBody.meta);
  } catch (err) {
    return next(err);
  }
});
