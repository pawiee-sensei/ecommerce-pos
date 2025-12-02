const bcrypt = require('bcryptjs');

(async () => {
  const password = "admin123"; // change this to any password you want to hash
  const hashed = await bcrypt.hash(password, 10);
  console.log("HASHED PASSWORD:", hashed);
})();
