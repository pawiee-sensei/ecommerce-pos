require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');

const app = express();

// =========================
// Helmet Security + CSP
// =========================
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],

        // Allow ONLY local scripts (no CDN JS allowed)
        "script-src": ["'self'"],

        // Bootstrap CSS CDN allowed
        "style-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"  // Bootstrap CSS
        ],

        // Allow images
        "img-src": ["'self'", "data:"],

        // Allow fonts from jsDelivr (Bootstrap font files)
        "font-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],

        // AJAX/XHR/fetch
        "connect-src": ["'self'"],

        // Prevent framing
        "frame-src": ["'none'"]
      }
    }
  })
);

// =========================
// Middleware
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

// =========================
// Sessions
// =========================
app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE),
      httpOnly: true,
      secure: false // switch to true if HTTPS
    }
  })
);

// =========================
// Static + View Engine
// =========================
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =========================
// ROUTES
// =========================
app.use('/auth', authRoutes);

// Default redirect
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// =========================
// Run server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
