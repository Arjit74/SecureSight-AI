const csrf = require('csurf');
const cookieParser = require('cookie-parser');

/**
 * CSRF Protection Middleware Setup
 * Protects against Cross-Site Request Forgery attacks
 */

// CSRF protection middleware (cookie-based)
const csrfProtection = csrf({ cookie: false }); // Using session tokens instead of cookies

// Parse cookies middleware
const parseCookies = cookieParser();

/**
 * Setup CSRF protection
 * Use this in your Express app:
 * 
 * app.use(parseCookies);
 * app.use(csrfProtection);
 * 
 * For forms that need CSRF tokens:
 * app.get('/form', csrfProtection, (req, res) => {
 *   res.json({ csrfToken: req.csrfToken() });
 * });
 */

module.exports = {
  csrfProtection,
  parseCookies,
  
  /**
   * CSRF Error Handler
   * Add this as middleware after CSRF protection
   */
  csrfErrorHandler: (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({
        error: 'CSRF token invalid or missing',
        message: 'Invalid CSRF token. Please try again.'
      });
    }
    next(err);
  },

  /**
   * Add CSRF token to response headers
   * Use after csrfProtection middleware
   */
  attachCsrfToken: (req, res, next) => {
    res.setHeader('X-CSRF-Token', req.csrfToken());
    next();
  }
};
