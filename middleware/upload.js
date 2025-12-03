const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/products'));
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, unique + ext);
  }
});

// File filter
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid image format'), false);
  }

  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
