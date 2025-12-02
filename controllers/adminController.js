const path = require('path');

module.exports = {
  // Render the admin shell (sidebar + topbar + empty panel container)
  showAdmin: async (req, res) => {
    res.render('admin/dashboard'); // This is the main admin shell
  },

  // Load a panel dynamically into #panel-container
  loadPanel: async (req, res) => {
    const panel = req.params.panel;

    const allowedPanels = ['dashboard', 'products', 'pos', 'strategy'];

    if (!allowedPanels.includes(panel)) {
      return res.status(404).send('Panel not found');
    }

    // Render EJS partials like: views/admin/panels/dashboard.ejs
    return res.render(`admin/panels/${panel}`);
  }
};
