import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
  const secure = isProduction || sameSite === 'none';
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

// Helper to set cookie
function setAuthCookie(res, token) {
  res.cookie('token', token, getCookieOptions());
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanUsername = username.trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Each new user starts with ₹10,00,000 virtual cash
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, cash)
      VALUES (?, ?, 1000000.0)
    `).run(cleanUsername, password_hash);

    const user = {
      id: result.lastInsertRowid,
      username: cleanUsername,
      cash: 1000000.0
    };

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Account created successfully! Welcome to Dalal Dojo.',
      user,
      token
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const cleanUsername = username.trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        username: user.username,
        cash: user.cash
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
  const secure = isProduction || sameSite === 'none';

  res.clearCookie('token', {
    httpOnly: true,
    secure,
    sameSite
  });
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, cash, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

export default router;
