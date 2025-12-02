const authService = require('../services/authService');

module.exports = {
  showLoginPage: async (req, res) => {
    res.render('auth/login', { error: null });
  },

  login: async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await authService.login({
        identifier: username,
        password
      });

      if (!user) {
        return res.render('auth/login', { error: 'Invalid credentials' });
      }

      // Save user in session
      req.session.user = user;

      // Redirect admin or staff
      if (user.role === 'admin') return res.redirect('/admin');
      return res.redirect('/pos');

    } catch (error) {
      console.error('Login Error:', error);
      res.render('auth/login', { error: 'Server error, try again.' });
    }
  },

  logout: async (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }
};
