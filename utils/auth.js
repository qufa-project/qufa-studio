
const checkAuth = (req, res, next) => {
  if(req.user) {
    next()
  } else {
    req.flash('error', '세션이 만료되었습니다.');
    return res.redirect('login');
  }
}

/**
 * 
 * @param {Number} role 권한을 설정한다. 입력한 role보다 권한이 높거나 같다면(role이 작거나 같다면) next로 넘어간다.
 * @returns 
 */
const checkRole = (role) => {
  return async (req, res, next) => {
    if(req.user.role <= role) {
      return next()
    }
    
    const referer = req.get('Referer') ? req.get('Referer') : '/'
    req.flash('error', '권한이 부족합니다.');
    return res.redirect(referer)
};
}

module.exports = {
  checkAuth,
  checkRole
}