var express = require("express");
const GroupService = require("../services/GroupsService");
const UserService = require("../services/UserService");
var router = express.Router();
const auth = require('../utils/auth')

var users = [
  {
    id: 1,
    username: 'admin',
    group: {
      id: 1,
      name: 'ptech'
    },
    updatedAt: new Date(),
    createdAt: new Date()
  }
]

const userService = new UserService();
const groupService = new GroupService();

/* GET users listing. */
router.get("/", auth.checkAuth, auth.checkRole(0), async function (req, res, next) {
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 10,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "DESC",
    groupId: req.user.group.id
  };

  const users = await userService.findAllByGroup(options)

  options.currentPage = parseInt(options.currentPage);
  options.total = Math.ceil(users.count / options.perPage);
  options.path = req.path;
  options.query = req.query;

  res.render("users/index", {
    users: users.rows,
    pageOption: options
  })
});

router.get("/new", auth.checkAuth, auth.checkRole(0), async function(req, res, next) {
  const {groupId} = req.query

  let group;
  if(groupId != undefined) {
    group = await groupService.findById(groupId);
  }

  res.render("users/new", {
    group
  })
})

// TODO: 임시 사용자 등록, Session이 생기면 Validation이후 Falsh를 이용한 처리가 필요함.
router.post("/", auth.checkAuth, auth.checkRole(0), async function(req, res, next) {
  const {username, password, confirm_password, role, groupId} = req.body;
  const currentUser = req.user;

  if(password.length < 6) {
    req.flash('error', '비밀번호가 짧습니다.(6자 이상 사용)')
    return res.redirect('/users/new')
  }

  if(password !== confirm_password) {
    req.flash('error', '비밀번호가 일치하지 않습니다.')
    return res.redirect('/users/new')
  }

  const existUsername = await userService.findByUsername(username);
  if(existUsername != undefined) {
    req.flash('error', '사용 할 수 없는 username입니다.')
    return res.redirect('/users/new')
  }

  if(role == undefined || role.length <= 0) {
    req.flash('error', '권한을 선택해주세요.')
    return res.redirect('/users/new')
  }

  if(currentUser.group.id != groupId && currentUser.group.id != 1) {
    req.flash('error', '해당 그룹의 사용자를 생성 할 권한이 없습니다.')
    return res.redirect('/users/new')
  }

  await userService.create({
    username,
    password,
    group_id: groupId,
    role: role
  })

  res.redirect("/users");
})

module.exports = router;
