import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/account/reset
router.post('/reset', (req, res) => {
  try {
    const userId = req.user.id;

    const tx = db.transaction(() => {
      // 1. Delete all holdings
      db.prepare('DELETE FROM holdings WHERE user_id = ?').run(userId);

      // 2. Delete all orders
      db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);

      // 3. Reset cash to ₹10,00,000
      db.prepare('UPDATE users SET cash = 1000000.0 WHERE id = ?').run(userId);

      return db.prepare('SELECT id, username, cash FROM users WHERE id = ?').get(userId);
    });

    const updatedUser = tx();

    res.json({
      message: 'Account reset successful. Holdings cleared and ₹10,00,000 restored.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Account reset error:', err);
    res.status(500).json({ error: 'Failed to reset account.' });
  }
});

export default router;
