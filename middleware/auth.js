module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  },

  ensureAdmin: (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied — Admins only');
    }
    next();
  }
};
