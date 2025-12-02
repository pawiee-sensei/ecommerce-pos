const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

module.exports = {
  // Register user
  register: async ({ username, password, role }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await userModel.createUser({
      username,
      password: hashedPassword,
      role
    });
  },

  // Login user
  login: async ({ identifier, password }) => {
    const user = await userModel.findByUsernameOrEmail(identifier);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    // Remove sensitive data before session
    delete user.password;
    return user;
  }
};
