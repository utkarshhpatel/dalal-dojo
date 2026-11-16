import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuote } from '../services/priceEngine.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/watchlist
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare('SELECT symbol, created_at FROM watchlist WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const items = rows.map(r => {
      const quote = getQuote(r.symbol) || {
        symbol: r.symbol,
        name: r.symbol,
        currentPrice: 0,
        change: 0,
        changePercent: 0,
        previousClose: 0
      };
      return {
        ...quote,
        starredAt: r.created_at
      };
    });

    res.json({ watchlist: items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist.' });
  }
});

// POST /api/watchlist
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    let { symbol } = req.body;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Valid symbol is required.' });
    }
    symbol = symbol.toUpperCase().trim();

    db.prepare(`
      INSERT OR IGNORE INTO watchlist (user_id, symbol)
      VALUES (?, ?)
    `).run(userId, symbol);

    res.status(201).json({ message: `${symbol} added to watchlist.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist.' });
  }
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', (req, res) => {
  try {
    const userId = req.user.id;
    const symbol = req.params.symbol.toUpperCase().trim();

    db.prepare('DELETE FROM watchlist WHERE user_id = ? AND symbol = ?').run(userId, symbol);

    res.json({ message: `${symbol} removed from watchlist.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist.' });
  }
});

export default router;
