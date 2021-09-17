var express = require("express");
const group = require("../models/group");
const GroupService = require("../services/GroupsService");
const UserService = require("../services/UserService");
const auth = require('../utils/auth')

var router = express.Router();

const groupService = new GroupService();
const userService = new UserService();

router.get("/", auth.checkAuth, auth.checkRole(0), async function(req, res, next) {
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 10,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "DESC",
  };

  const groups = await groupService.findAll(options);

  res.render("groups/index", {
    groups: groups
  })
})

router.post("/", auth.checkAuth, auth.checkRole(0), async function(req, res, next) {
  const {name, description} = req.body

  const newGroup = {
    name: name,
    description: description
  }

  await groupService.create(newGroup);

  res.redirect("/groups")
})

router.get("/:id", auth.checkAuth, auth.checkRole(0), async function(req, res, next) {
  const {id} = req.params

  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 10,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "DESC",
    groupId: id
  };

  const group = await groupService.findById(id)
  const users = await userService.findAllByGroup(options)

  options.currentPage = parseInt(options.currentPage);
  options.total = Math.ceil(users.count / options.perPage);
  options.path = req.path;
  options.query = req.query;

  res.render("groups/show", {
    group: group,
    users: users.rows,
    pageOption: options
  })
})

module.exports = router