var express = require("express");
var router = express.Router();
const auth = require('../utils/auth')

const ProjectService = require("../services/ProjectService");
const TaskService = require("../services/TaskService");

const DataManager = require("../lib/DataManager");
const RawDataManager = require("../lib/RawDataManager");

const projectService = new ProjectService();
const taskService = new TaskService();

router.get("/", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 10,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "DESC",
    groupId: req.user.group.id
  };

  const projects = await projectService.findAllByGroup(options)
  options.currentPage = parseInt(options.currentPage);
  options.path = "/projects";
  options.query = req.query;
  options.total = Math.ceil(projects.count / options.perPage);

  res.render("projects/index", {
    title: "QUFA 프로젝트 목록",
    projects,
    pageOption: options,
  });
});

router.get("/:id", auth.checkAuth, auth.checkRole(1),async function (req, res, next) {
  const project = await projectService.findWithRelations(req.params.id);
  const dataset = project.originDataset();

  res.render("projects/show", {
    title: `QUFA - ${project.title}`,
    project,
    dataset,
  });
});

router.post("/", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const project = await projectService.create(req.body);
  if (project && project.id) {
    res.redirect(301, `/projects/${project.id}/init`);
  }

  res.render("projects/error", { title: "QUFA 프로젝트 오류", project });
});

router.get("/:id/init", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const project = await projectService.find(req.params.id);
  res.render("projects/init", { title: "QUFA 프로젝트 데이터 등록", project });
});

router.get("/new", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const project = await projectService.findWithDatasets(req.params.id);
  res.render("projects/new", { title: "QUFA 프로젝트 등록" });
});

router.post("/:id/tasks", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const project = await projectService.findWithTasks(req.params.id);
  const taskList = req.body;

  if (taskList && taskList.length) {
    const tasks = await projectService.createTasks(project, taskList);
    res.json(tasks);
  } else {
    res.json({});
  }
});

router.get("/:id/tasks/:taskId", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const project = await projectService.findWithRelations(req.params.id);
  const task = await taskService.findWithDataset(req.params.taskId);

  res.render("projects/show", {
    title: `QUFA - ${project.title}`,
    project,
    currentTask: task,
    dataset: task.dataset,
  });
});

router.get("/:id/back", auth.checkAuth, auth.checkRole(1), async function (req, res, next) {
  const data = await DataManager.findWithMeta(req.params.id);
  res.render("projects/show", { title: "QUFA 프로젝트 등록", data });
});

module.exports = router;
