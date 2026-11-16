import express from 'express';
import db from '../db/database.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';
import { getQuote } from '../services/priceEngine.js';

const router = express.Router();

router.use(optionalAuthMiddleware);

// GET /api/leaderboard
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, cash, created_at FROM users').all();
    const holdings = db.prepare('SELECT user_id, symbol, quantity FROM holdings WHERE quantity > 0').all();
    const tradeCounts = db.prepare(`
      SELECT user_id, COUNT(*) as trades_count 
      FROM orders 
      WHERE status = 'EXECUTED' 
      GROUP BY user_id
    `).all();

    const tradeMap = new Map(tradeCounts.map(t => [t.user_id, t.trades_count]));

    // Group holdings by user_id
    const userHoldingsMap = new Map();
    for (const h of holdings) {
      if (!userHoldingsMap.has(h.user_id)) {
        userHoldingsMap.set(h.user_id, []);
      }
      userHoldingsMap.get(h.user_id).push(h);
    }

    const startingCapital = 1000000.0;

    const rankedUsers = users.map(user => {
      const userHoldings = userHoldingsMap.get(user.id) || [];
      let holdingsValue = 0;

      for (const h of userHoldings) {
        const quote = getQuote(h.symbol);
        const price = quote ? quote.currentPrice : 0;
        holdingsValue += h.quantity * price;
      }

      holdingsValue = Math.round(holdingsValue * 100) / 100;
      const netWorth = Math.round((user.cash + holdingsValue) * 100) / 100;
      const totalPnl = Math.round((netWorth - startingCapital) * 100) / 100;
      const returnPercent = Math.round(((netWorth - startingCapital) / startingCapital) * 10000) / 100;

      return {
        id: user.id,
        username: user.username,
        cash: user.cash,
        holdingsValue: holdingsValue,
        netWorth: netWorth,
        totalPnl: totalPnl,
        returnPercent: returnPercent,
        tradesCount: tradeMap.get(user.id) || 0,
        isCurrentUser: req.user ? req.user.id === user.id : false
      };
    });

    // Sort descending by returnPercent
    rankedUsers.sort((a, b) => b.returnPercent - a.returnPercent);

    // Assign rank
    const top20 = rankedUsers.slice(0, 20).map((u, index) => ({
      ...u,
      rank: index + 1
    }));

    res.json({ leaderboard: top20 });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to compute leaderboard.' });
  }
});

export default router;
