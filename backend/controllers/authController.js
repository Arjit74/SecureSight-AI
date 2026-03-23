const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Authentication Controller
 * Handles user login and token generation
 */

// Mock user database (replace with actual DB)
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@securesight.local',
    role: 'admin',
    passwordHash: '$2b$10$...' // bcrypt hash in production
  },
  {
    id: 2,
    username: 'analyst',
    email: 'analyst@securesight.local',
    role: 'analyst',
    passwordHash: '$2b$10$...'
  }
];

/**
 * Login endpoint
 * POST /api/auth/login
 * @param {string} username
 * @param {string} password
 * @returns {token, user}
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (in production: use bcrypt.compare)
    // const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    // if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Register endpoint
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password (in production)
    // const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length + 1,
      username,
      email,
      role: role || 'user',
      passwordHash: 'hashed_password_here'
    };

    users.push(newUser);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
exports.getCurrentUser = (req, res) => {
  return res.json({
    user: req.user
  });
};

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // In production, implement token blacklist or DB logout tracking
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
