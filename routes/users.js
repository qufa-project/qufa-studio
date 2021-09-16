var express = require("express");
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

/* GET users listing. */
router.get("/", auth.checkAuth, async function (req, res, next) {
  const options = {
    currentPage: req.query.currentPage || 1,
    perPage: req.query.perPage || 10,
    sortCol: req.query.sortCol || "id",
    sortDir: req.query.sortDir || "DESC",
  };

  const users = await userService.findAll(options)
  res.render("users/index", {
    users: users
  })
});

router.get("/new", auth.checkAuth, function(req, res, next) {
  res.render("users/new")
})

// TODO: 임시 사용자 등록, Session이 생기면 Validation이후 Falsh를 이용한 처리가 필요함.
router.post("/", auth.checkAuth, async function(req, res, next) {
  const {username, password, confirm_password} = req.body;
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

  await userService.create({
    username,
    password,
    group_id: currentUser.group_id
  })

  res.redirect("/users");
})

module.exports = router;
