const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require("../models");
const UserService = require("../services/UserService");

const userService = new UserService();

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(new LocalStrategy({ // local 전략을 세움
    usernameField: 'username',
    passwordField: 'password',
    session: true,
    passReqToCallback: false,
  }, async (username, password, done) => {
    try {
      const user = await userService.findByUsername(username);
      if(!user) {
        return done(new Error("사용자를 찾을 수 없습니다."), false)
      }

      const isPasswordMatched = userService.validateUserPassword(user, password)
      console.log(isPasswordMatched)
      if(isPasswordMatched) {
        return done(null, user);
      } else {
        return done(new Error("비밀번호가 틀렸습니다."), false);
      }
    } catch(err) {
      return done(err)
    }
  }));
};