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
    passReqToCallback: true,
  }, async (req, username, password, done) => {
    try {
      const user = await userService.findByUsername(username);
      if(!user) {
        return done(null, false, req.flash('error', '사용자를 찾을 수 없습니다.'))
      }

      const isPasswordMatched = userService.validateUserPassword(user, password)
      if(isPasswordMatched) {
        return done(null, user);
      } else {
        return done(null, false, req.flash('error', '비밀번호가 일치하지 않습니다.'))
      }
    } catch(err) {
      return done(err)
    }
  }));
};