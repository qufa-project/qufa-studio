var express = require("express");
var router = express.Router();
var multer = require("multer");
const axios = require("axios");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

const profileConfig = require("../configs/config").profiler;

const DatasetService = require("../services/DatasetService");
const datasetService = new DatasetService();

const ColstatService = require("../services/ColstatService");
const colstatService = new ColstatService();

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

    res.json({ projectId, id: dataset.id });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  const dataset = await DatasetManager.findWithMeta(req.params.id);
  if (dataset.status == "done") {
    const options = {
      currentPage: req.query.currentPage || 1,
      perPage: req.query.perPage || 50,
      sortCol: req.query.sortCol || "_id_",
      sortDir: req.query.sortDir || "asc",
    };

    const results = await RawDataManager.search(dataset, options);
    res.json({ dataset, results });
  } else {
    res.json(null);
  }
});

router.get("/:id/profile", async function (req, res, next) {
  const dataset = await DatasetManager.findWithTask(req.params.id);

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

      if (dataset.task) {
        await dataset.task.setDone();
      }
    }

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.json(null);
  }
});

router.get("/:id/download", async function (req, res, next) {
  const dataset = await datasetService.findWithProjectTask(req.params.id);
  const fileStream = FileManager.createReadStream(dataset.remotePath);

  let fileName = dataset.project.title;
  if (dataset.task) {
    fileName = `${fileName}_${dataset.task.task}`;
  }
  fileName = `${fileName}.csv`;

  res.attachment(fileName);
  fileStream.pipe(res);
});

router.get("/:id/features", async function (req, res, next) {
  const data = await DatasetManager.findWithFeatures(req.params.id);
  res.json(data.features);
});

router.get("/:id/imputation", async function (req, res, next) {
  const data = await DatasetManager.find(req.params.id);

  try {
    console.log(data.getResultJson());
    const s3Obj = await FileManager.findS3Objct(data.getResultJson());
    res.json(JSON.parse(s3Obj.Body.toString("utf-8")));
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.get("/:id/outlier", async function (req, res, next) {
  const data = await DatasetManager.find(req.params.id);

  try {
    const s3Obj = await FileManager.findS3Objct(data.getResultJson());
    const jsonObj = JSON.parse(s3Obj.Body.toString("utf-8"));

    const ids = [];
    for (const idx of jsonObj.result.outlier_indices) {
      ids.push(idx - 1);
    }

    const dataset = await datasetService.findOriginByProject(data.projectId);

    const deletedData = await RawDataManager.searchByIds(dataset, ids);
    res.json({ result: jsonObj.result, deletedData });
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.get("/:id/importance", async function (req, res, next) {
  const data = await DatasetManager.findWithImportance(req.params.id);
  res.json(data);
});

router.post("/:id/fairness", async function (req, res, next) {
  const datasetId = req.params.id;
  const checkedCols = req.body.checkedCols;

  const after = await colstatService.search(datasetId, checkedCols, true);
  const before = await colstatService.search(datasetId, checkedCols, false);

  res.json({
    before,
    after,
  });
});

router.get("/:id/fairness", async function (req, res, next) {
  const dataset = await DatasetManager.find(req.params.id);

  try {
    const before = await FileManager.findS3Objct(
      dataset.getFairnessDataJson(true)
    );

    const after = await FileManager.findS3Objct(
      dataset.getFairnessDataJson(false)
    );

    res.json({
      before: JSON.parse(before.Body.toString("utf-8")),
      after: JSON.parse(after.Body.toString("utf-8")),
    });
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.get("/:id/fairnessResult", async function (req, res, next) {
  const dataset = await DatasetManager.find(req.params.id);

  try {
    const s3Obj = await FileManager.findS3Objct(
      dataset.getFairnessResultJson()
    );
    res.json(JSON.parse(s3Obj.Body.toString("utf-8")));
  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

router.post("/originByProject", async function (req, res, next) {
  const projectId = req.body.projectId;
  const dataset = await datasetService.findOriginByProject(projectId);

  const results = await RawDataManager.searchByIds(dataset, req.body.dataIds);
  res.json(results);
});

module.exports = router;
