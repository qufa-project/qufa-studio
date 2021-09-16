var express = require("express");
const UserService = require("../services/UserService");
var router = express.Router();

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
router.get("/", function (req, res, next) {
  res.render("users/index", {
    users: users
  })
});

router.get("/new", function(req, res, next) {
  res.render("users/new")
})

// TODO: 임시 사용자 등록, Session이 생기면 Validation이후 Falsh를 이용한 처리가 필요함.
router.post("/", async function(req, res, next) {
  const {username, password, confirm_password} = req.body;

  if(password !== confirm_password) {
    req.flash('danger', '비밀번호가 일치하지 않습니다.')
    res.redirect('/users/new')
  }

  const user = await userService.create({
    username,
    password,
    group_id: 1
  })

  console.log(user);
  res.redirect("/users");
})

module.exports = router;
