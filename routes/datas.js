var express = require("express");
var router = express.Router();
var multer = require('multer');

var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

var FileManager = require("../lib/FileManager")

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
module.exports = router;
