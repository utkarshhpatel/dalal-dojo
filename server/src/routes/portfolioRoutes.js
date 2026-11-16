import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuote } from '../services/priceEngine.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/portfolio
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    const user = db.prepare('SELECT id, username, cash FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const rawHoldings = db.prepare('SELECT * FROM holdings WHERE user_id = ? AND quantity > 0').all(userId);

    let totalInvested = 0;
    let currentPortfolioValue = 0;
    let dayPnl = 0;

    const holdings = rawHoldings.map(h => {
      const quote = getQuote(h.symbol) || {
        currentPrice: h.avg_price,
        previousClose: h.avg_price,
        name: h.symbol,
        changePercent: 0
      };

      const ltp = quote.currentPrice;
      const investedValue = Math.round(h.quantity * h.avg_price * 100) / 100;
      const currentValue = Math.round(h.quantity * ltp * 100) / 100;
      const pnl = Math.round((currentValue - investedValue) * 100) / 100;
      const pnlPercent = investedValue > 0 ? Math.round((pnl / investedValue) * 10000) / 100 : 0;
      const holdingDayPnl = Math.round((ltp - quote.previousClose) * h.quantity * 100) / 100;

      totalInvested += investedValue;
      currentPortfolioValue += currentValue;
      dayPnl += holdingDayPnl;

      return {
        id: h.id,
        symbol: h.symbol,
        name: quote.name || h.symbol,
        sector: quote.sector || 'NSE',
        quantity: h.quantity,
        avg_price: h.avg_price,
        ltp: ltp,
        invested_value: investedValue,
        current_value: currentValue,
        pnl: pnl,
        pnl_percent: pnlPercent,
        day_pnl: holdingDayPnl,
        day_change_percent: quote.changePercent || 0
      };
    });

    totalInvested = Math.round(totalInvested * 100) / 100;
    currentPortfolioValue = Math.round(currentPortfolioValue * 100) / 100;
    dayPnl = Math.round(dayPnl * 100) / 100;

    const totalPnl = Math.round((currentPortfolioValue - totalInvested) * 100) / 100;
    const totalPnlPercent = totalInvested > 0 ? Math.round((totalPnl / totalInvested) * 10000) / 100 : 0;
    const netWorth = Math.round((user.cash + currentPortfolioValue) * 100) / 100;
    const startingCapital = 1000000.0;
    const totalReturnPercent = Math.round(((netWorth - startingCapital) / startingCapital) * 10000) / 100;

    // Portfolio Allocation for donut chart
    const allocation = holdings.map(h => ({
      symbol: h.symbol,
      name: h.name,
      value: h.current_value,
      percentage: netWorth > 0 ? Math.round((h.current_value / netWorth) * 10000) / 100 : 0
    }));

    // Add cash to allocation
    if (user.cash > 0) {
      allocation.push({
        symbol: 'CASH',
        name: 'Liquid Cash',
        value: Math.round(user.cash * 100) / 100,
        percentage: netWorth > 0 ? Math.round((user.cash / netWorth) * 10000) / 100 : 0
      });
    }

    // Check if any single stock exceeds 40% of net worth
    const highRiskHolding = holdings.find(h => netWorth > 0 && (h.current_value / netWorth) > 0.4);

    res.json({
      summary: {
        cash: user.cash,
        invested: totalInvested,
        current_value: currentPortfolioValue,
        net_worth: netWorth,
        total_pnl: totalPnl,
        total_pnl_percent: totalPnlPercent,
        day_pnl: dayPnl,
        total_return_percent: totalReturnPercent,
        has_concentration_risk: !!highRiskHolding,
        high_risk_symbol: highRiskHolding ? highRiskHolding.symbol : null,
        high_risk_percent: highRiskHolding ? Math.round((highRiskHolding.current_value / netWorth) * 100) : 0
      },
      holdings,
      allocation
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to compute portfolio.' });
  }
});

export default router;
