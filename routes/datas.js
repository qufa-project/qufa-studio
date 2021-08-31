var express = require("express");
var router = express.Router();
var multer = require("multer");
const axios = require("axios");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

const profileConfig = require("../configs/config").profiler;

var DataManager = require("../lib/DataManager");
var FileManager = require("../lib/FileManager");
var MetaManager = require("../lib/MetaManager");
var RawDataManager = require("../lib/RawDataManager");

const child_process = require("child_process");

/**
 * @openapi
 * /datas:
 *   get:
 *     description: Welcome to swagger-jsdoc!
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.get("/:id", async function (req, res, next) {
  const data = await DataManager.findWithMeta(req.params.id);
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 50,
    sort: req.query.sort || "id",
    sortDir: req.query.sortDir || "asc",
  };

  const rows = await RawDataManager.search(data, options);
  res.json({ data, rows });
});

router.get("/:id/profile", async function (req, res, next) {
  const data = await DataManager.find(req.params.id);

  try {
    const response = await axios.get(
      `${profileConfig.baseUrl}/profile/${data.dataTable}`
    );
    console.log(response);

    res.json(response.data);
  } catch (err) {
    res.json(null);
  }
});

/**
 * @openapi
 * /datas:
 *   post:
 *     description: Welcome to swagger-jsdoc!
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.post("/", upload.single("file"), async function (req, res, next) {
  try {
    console.log(req.file);
    const reqBody = req.body;
    const parseOption = JSON.parse(reqBody.parseOption);
    const meta = JSON.parse(reqBody.meta);

    const fileName = `${new Date().getTime()}_${req.file.originalname}`;
    const data = await DataManager.create(fileName, req.file);
    const metaList = await MetaManager.createAll(data, meta);
    console.log(data);
    console.log(data.id);
    const s3Res = await FileManager.uploadFile(data.id, fileName, req.file);
    console.log(s3Res);
    data.remotePath = `${s3Res}`;
    await data.save();

    await RawDataManager.makeDataTable(data.dataTable, metaList);

    const ls = child_process.spawn("node", [
      "./scripts/parseCsv.js",
      JSON.stringify({
        dataId: data.id,
        parseOption: parseOption,
      }),
    ]);

    ls.stdout.on("data", function (data) {
      console.log("stdout: " + data);
    });

    ls.stderr.on("data", function (data) {
      console.log("stderr: " + data);
    });

    ls.on("exit", function (code) {
      console.log("exit: " + code);
    });

    res.json({ id: data.id });
  } catch (err) {
    console.log(err);
    res.json({ err: err });
  }
});

router.post("/test", upload.single("file"), async function (req, res, next) {
  console.log(req.file);
  console.log(req.body.meta);
  const formData = req.body;
  res.json("upload success");
});

/**
 * @openapi
 * /datas/{id}/importance:
 *   post:
 *     description: data id와 request body를 통해서 중요도 분석을 요청합니다.
 *     parameters:
 *      - in: path
 *        required: true
 *        name: id
 *        schema:
 *         type: integer
 *        description: 중요도 분석을 위해 Target meta ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metaId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.post("/:id/importance", async function (req, res, next) {
  try {
    const dataId = req.params.id;
    const metaId = req.body.metaId;

    const data = await DataManager.findWithMeta(dataId);

    if(data.metas.filter(el => el.id === metaId).length <= 0) {
      throw new Error("Cannot find meta which is included in dataId");
    }

    const ls = child_process.spawn("node", [
      "./scripts/importance.js",
      JSON.stringify({
        dataId: data.id,
        metaId: metaId
      }),
    ]);

    ls.stdout.on("data", function (data) {
      console.log("stdout: " + data);
    });

    ls.stderr.on("data", function (data) {
      console.log("stderr: " + data);
    });

    ls.on("exit", function (code) {
      console.log("exit: " + code);
    });

    res.json({ id: data.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err });
  }
});

router.post("/test", upload.single("file"), async function (req, res, next) {
  console.log(req.file);
  console.log(req.body.meta);
  const formData = req.body;
  res.json("upload success");
});

/**
 * @openapi
 * /datas/meta:
 *   get:
 *     description: Welcome to swagger-jsdoc!
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.get("/meta", async function (req, res, next) {
  res.json("success");
  const key = "1628471368985_stat_new_0526.csv";
  //const readStream = await FileManager.createReadStream(key);
  //detect file encoing using stream
  ls = child_process.spawn("node", ["./scripts/parseCsv.js", key]);
  ls.stdout.on("data", function (data) {
    console.log("stdout: " + data);
  });

  ls.stderr.on("data", function (data) {
    console.log("stderr: " + data);
  });

  ls.on("exit", function (code) {
    console.log("exit: " + code);
  });
});

module.exports = router;
