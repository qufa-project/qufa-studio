var express = require("express");
var router = express.Router();
var multer = require("multer");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

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
router.get("/", function (req, res, next) {
  res.json("data");
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
    const s3Res = await FileManager.uploadFile(fileName, req.file);
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

    //
    // console.log(response);
  } catch (err) {
    console.log(err);
  }
  res.json("upload success");
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
