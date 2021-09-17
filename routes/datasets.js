var express = require("express");
var router = express.Router();
var multer = require("multer");
const axios = require("axios");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var DatasetManager = require("../lib/DatasetManager");
var ChildProcessManager = require("../lib/ChildProcessManager");

router.post("/", upload.single("file"), async function (req, res, next) {
  try {
    const reqBody = req.body;

    const projectId = req.body.projectId;
    // TODO: 등록 요청한 User의 권한 확인 필요

    const parseOption = JSON.parse(reqBody.parseOption);
    const meta = JSON.parse(reqBody.meta);

    const dataset = await DatasetManager.create(projectId, meta, req.file);

    ChildProcessManager.runCsvParser(dataset, parseOption);

    res.json({ id: dataset.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
