
const checkAuth = (req, res, next) => {
  if(req.user) {
    next()
  } else {
    req.flash('error', '세션이 만료되었습니다.');
    return res.redirect('login');
  }
}

module.exports = {
  checkAuth
}