var express = require("express");
var router = express.Router();

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

module.exports = router;
