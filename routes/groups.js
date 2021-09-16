var express = require("express");
const group = require("../models/group");
const GroupService = require("../services/GroupsService");
var router = express.Router();

const groupService = new GroupService();

router.get("/", async function(req, res, next) {
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

router.post("/", async function(req, res, next) {
  const {name, description} = req.body

  const newGroup = {
    name: name,
    description: description
  }

  await groupService.create(newGroup);

  res.redirect("/groups")
})

router.get("/:id", async function(req, res, next) {
  const {id} = req.params

  const group = await groupService.findById(id)
  
  res.render("groups/show", {
    group: group
  })
})

module.exports = router