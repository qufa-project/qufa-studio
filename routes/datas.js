var express = require("express");
var router = express.Router();
var multer = require('multer');

var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

var FileManager = require("../lib/FileManager")
var MetaManager = require("../lib/MetaManager")

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
router.post("/", upload.single('file'), async function (req, res, next) {
  try {
    const response = await FileManager.uploadFile(req.file);
    console.log(response);
  } catch(err) {
    console.log(err)
  }
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
  const key = '1628471368985_stat_new_0526.csv'
  //const readStream = await FileManager.createReadStream(key);
  //detect file encoing using stream
  const encoding = await MetaManager.detectEncoding(key);
  const datas = await MetaManager.parseRecord(key, encoding);
  console.log(datas)
  res.json("success")
})

module.exports = router;
