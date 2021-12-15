var express = require("express");
const passport = require("passport");
var router = express.Router();
const auth = require("../utils/auth");
const ProjectService = require("../services/ProjectService");

const projectService = new ProjectService();

const DataManager = require("../lib/DataManager");

const formatBytes = function (bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/* GET home page. */
router.get(
  "/",
  auth.checkAuth,
  auth.checkRole(1),
  async function (req, res, next) {
    const options = {
      currentPage: req.query.currentPage || 1,
      perPage: req.query.perPage || 10,
      sortCol: req.query.sortCol || "id",
      sortDir: req.query.sortDir || "DESC",
      groupId: req.user.group.id,
    };

    const projects = await projectService.findAllByGroup(options);
    options.currentPage = parseInt(options.currentPage);
    options.path = "/projects";
    options.query = req.query;
    options.total = Math.ceil(projects.count / options.perPage);

    res.render("projects/index", {
      title: "QUFA 프로젝트 목록",
      projects,
      pageOption: options,
    });
  }
);

router.get("/login", function (req, res, next) {
  res.render("users/login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureFlash: true,
    failureRedirect: "/login",
  })
);

router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
