var express = require("express");
const GroupService = require("../services/GroupsService");
var router = express.Router();

var groups = [
  {
    id: 1,
    name: "qufa",
    description: "Qufa 전체 기능을 담당하는 그룹",
    updatedAt: "20210101",
    createdAt: "20210101"
  },
  {
    id: 1,
    name: "qufa",
    description: "Qufa 전체 기능을 담당하는 그룹",
    updatedAt: "20210101",
    createdAt: "20210101"
  },
  {
    id: 1,
    name: "qufa",
    description: "Qufa 전체 기능을 담당하는 그룹",
    updatedAt: "20210101",
    createdAt: "20210101"
  }
]

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

module.exports = router