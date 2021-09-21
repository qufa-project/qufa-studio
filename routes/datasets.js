var express = require("express");
var router = express.Router();
var multer = require("multer");
const axios = require("axios");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

const profileConfig = require("../configs/config").profiler;

const DatasetManager = require("../lib/DatasetManager");
const FileManager = require("../lib/FileManager");
const RawDataManager = require("../lib/RawDataManager");
const ChildProcessManager = require("../lib/ChildProcessManager");

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

router.get("/:id", async function (req, res, next) {
  const dataset = await DatasetManager.findWithMeta(req.params.id);
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 50,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "asc",
  };

  const results = await RawDataManager.search(dataset, options);
  res.json({ dataset, results });
});

router.get("/:id/profile", async function (req, res, next) {
  const dataset = await DatasetManager.find(req.params.id);

  try {
    const response = await axios.get(
      `${profileConfig.baseUrl}/profile/${dataset.dataTable}`
    );

    if (
      !dataset.hasProfile &&
      response &&
      response.data &&
      response.data.status == "success"
    ) {
      dataset.hasProfile = true;
      await dataset.save();
    }

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.json(null);
  }
});

router.get("/:id/download", async function (req, res, next) {
  const dataset = await DatasetManager.find(req.params.id);
  const fileStream = FileManager.createReadStream(dataset.remotePath);

  res.attachment(dataset.originFileName);
  fileStream.pipe(res);
});

router.get("/:id/features", async function (req, res, next) {
  const data = await DataManager.findWithFeatures(req.params.id);
  res.json(data.features);
});

router.get("/:id/imputation", async function (req, res, next) {
  const data = await DataManager.find(req.params.id);

  try {
    const s3Obj = await FileManager.findS3Objct(data.getImputationResultPath());
    console.log(data.getImputationResultPath());
    res.json(JSON.parse(s3Obj.Body.toString("utf-8")));
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.get("/:id/outlier", async function (req, res, next) {
  const data = await DataManager.find(req.params.id);

  try {
    const s3Obj = await FileManager.findS3Objct(data.getOutlierResultPath());
    res.json(JSON.parse(s3Obj.Body.toString("utf-8")));
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.get("/:id/importance", async function (req, res, next) {
  const data = await DataManager.findWithImportance(req.params.id);
  res.json(data);
});

module.exports = router;
