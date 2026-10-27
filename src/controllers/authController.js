const bcrypt = require('bcryptjs');
const pool = require('../db');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required',
      });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({
        message: 'Name must be 100 characters or less',
      });
    }

    if (email.trim().length > 255) {
      return res.status(400).json({
        message: 'Email must be 255 characters or less',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: 'Please enter a valid email address',
      });
    }
    if (!password.trim() || password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and not only spaces',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'User with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    req.session.userId = user.id;

    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'User with this email already exists',
      });
    }

    console.error('Registration error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE LOWER(email) = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    req.session.userId = user.id;

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

async function getCurrentUser(req, res) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: 'Not authenticated',
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Not authenticated',
      });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);

      return res.status(500).json({
        message: 'Could not log out',
      });
    }

    res.clearCookie('connect.sid');

    return res.json({
      message: 'Logged out successfully',
    });
  });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};
