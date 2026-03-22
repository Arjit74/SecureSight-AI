const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

// Admin only routes
router.get('/admin/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
  return res.json({ message: 'Admin can view all users' });
});

module.exports = router;
