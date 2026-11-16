import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuote } from '../services/priceEngine.js';

const router = express.Router();

router.use(authMiddleware);

// Helper for brokerage calculation: ₹20 or 0.03% whichever is lower
export function calculateBrokerage(turnover) {
  return Math.round(Math.min(20, turnover * 0.0003) * 100) / 100;
}

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    let { symbol, side, type, quantity, limit_price, note } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Valid stock symbol is required.' });
    }
    symbol = symbol.toUpperCase().trim();

    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({ error: "Order side must be 'BUY' or 'SELL'." });
    }

    if (!['MARKET', 'LIMIT'].includes(type)) {
      return res.status(400).json({ error: "Order type must be 'MARKET' or 'LIMIT'." });
    }

    quantity = parseInt(quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer.' });
    }

    if (type === 'LIMIT') {
      limit_price = parseFloat(limit_price);
      if (isNaN(limit_price) || limit_price <= 0) {
        return res.status(400).json({ error: 'Limit price must be a valid positive number.' });
      }
      limit_price = Math.round(limit_price * 100) / 100;
    } else {
      limit_price = null;
    }

    const cleanNote = note && typeof note === 'string' ? note.trim().slice(0, 300) : null;

    // Get current live/simulated market quote
    const quote = getQuote(symbol);
    if (!quote) {
      return res.status(400).json({ error: `Symbol ${symbol} is not available for trading.` });
    }
    const currentPrice = quote.currentPrice;

    // Fetch user cash
    const user = db.prepare('SELECT cash FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Fetch user holding
    const holding = db.prepare('SELECT * FROM holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol);

    if (side === 'SELL') {
      const heldQty = holding ? holding.quantity : 0;
      // Also check pending sell orders so user cannot sell more than held
      const pendingSellRow = db.prepare(`
        SELECT SUM(quantity) as pending_qty 
        FROM orders 
        WHERE user_id = ? AND symbol = ? AND side = 'SELL' AND status = 'PENDING'
      `).get(userId, symbol);
      const pendingSellQty = pendingSellRow?.pending_qty || 0;

      const availableQty = heldQty - pendingSellQty;
      if (availableQty < quantity) {
        return res.status(400).json({
          error: `Insufficient shares. You hold ${heldQty} shares (${pendingSellQty} locked in pending limit orders). Available to sell: ${Math.max(0, availableQty)}.`
        });
      }
    }

    if (side === 'BUY') {
      const execPrice = type === 'LIMIT' ? limit_price : currentPrice;
      const turnover = quantity * execPrice;
      const brokerage = calculateBrokerage(turnover);
      const totalRequired = turnover + brokerage;

      // Also check reserved cash for pending buy limit orders
      const pendingBuyRow = db.prepare(`
        SELECT SUM((quantity * limit_price) + MIN(20, (quantity * limit_price) * 0.0003)) as reserved_cash
        FROM orders 
        WHERE user_id = ? AND side = 'BUY' AND status = 'PENDING'
      `).get(userId);
      const reservedCash = pendingBuyRow?.reserved_cash || 0;
      const availableCash = user.cash - reservedCash;

      if (availableCash < totalRequired) {
        return res.status(400).json({
          error: `Insufficient virtual cash. Required: ₹${totalRequired.toFixed(2)}, Available: ₹${Math.max(0, availableCash).toFixed(2)}.`
        });
      }
    }

    // Now handle MARKET vs LIMIT order placement
    const now = new Date().toISOString();

    if (type === 'MARKET') {
      // Execute immediately inside a transaction
      const turnover = quantity * currentPrice;
      const brokerage = calculateBrokerage(turnover);

      const tx = db.transaction(() => {
        if (side === 'BUY') {
          const totalCost = turnover + brokerage;
          db.prepare('UPDATE users SET cash = cash - ? WHERE id = ?').run(totalCost, userId);

          if (holding) {
            const newQty = holding.quantity + quantity;
            const newAvgPrice = Math.round(((holding.quantity * holding.avg_price) + turnover) / newQty * 100) / 100;
            db.prepare('UPDATE holdings SET quantity = ?, avg_price = ? WHERE id = ?').run(newQty, newAvgPrice, holding.id);
          } else {
            db.prepare('INSERT INTO holdings (user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?)').run(userId, symbol, quantity, currentPrice);
          }

          const orderResult = db.prepare(`
            INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at, executed_at)
            VALUES (?, ?, ?, 'MARKET', ?, NULL, ?, 'EXECUTED', ?, ?, ?, ?)
          `).run(userId, symbol, side, quantity, currentPrice, brokerage, cleanNote, now, now);

          return { orderId: orderResult.lastInsertRowid, executedPrice: currentPrice, fees: brokerage };

        } else { // SELL
          const proceeds = turnover - brokerage;
          db.prepare('UPDATE users SET cash = cash + ? WHERE id = ?').run(proceeds, userId);

          const newQty = holding.quantity - quantity;
          if (newQty === 0) {
            db.prepare('DELETE FROM holdings WHERE id = ?').run(holding.id);
          } else {
            db.prepare('UPDATE holdings SET quantity = ? WHERE id = ?').run(newQty, holding.id);
          }

          const orderResult = db.prepare(`
            INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at, executed_at)
            VALUES (?, ?, ?, 'MARKET', ?, NULL, ?, 'EXECUTED', ?, ?, ?, ?)
          `).run(userId, symbol, side, quantity, currentPrice, brokerage, cleanNote, now, now);

          return { orderId: orderResult.lastInsertRowid, executedPrice: currentPrice, fees: brokerage };
        }
      });

      const result = tx();
      const updatedUser = db.prepare('SELECT cash FROM users WHERE id = ?').get(userId);

      return res.status(201).json({
        message: `${side} order for ${quantity} shares of ${symbol} executed successfully at ₹${result.executedPrice.toFixed(2)}.`,
        orderId: result.orderId,
        status: 'EXECUTED',
        executedPrice: result.executedPrice,
        fees: result.fees,
        newCashBalance: updatedUser.cash
      });

    } else {
      // LIMIT order
      // Check if price already matches condition for instant fill
      const shouldFillImmediately = (side === 'BUY' && currentPrice <= limit_price) || (side === 'SELL' && currentPrice >= limit_price);

      if (shouldFillImmediately) {
        const turnover = quantity * currentPrice;
        const brokerage = calculateBrokerage(turnover);

        const tx = db.transaction(() => {
          if (side === 'BUY') {
            const totalCost = turnover + brokerage;
            db.prepare('UPDATE users SET cash = cash - ? WHERE id = ?').run(totalCost, userId);

            if (holding) {
              const newQty = holding.quantity + quantity;
              const newAvgPrice = Math.round(((holding.quantity * holding.avg_price) + turnover) / newQty * 100) / 100;
              db.prepare('UPDATE holdings SET quantity = ?, avg_price = ? WHERE id = ?').run(newQty, newAvgPrice, holding.id);
            } else {
              db.prepare('INSERT INTO holdings (user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?)').run(userId, symbol, quantity, currentPrice);
            }

            const orderResult = db.prepare(`
              INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at, executed_at)
              VALUES (?, ?, ?, 'LIMIT', ?, ?, ?, 'EXECUTED', ?, ?, ?, ?)
            `).run(userId, symbol, side, quantity, limit_price, currentPrice, brokerage, cleanNote, now, now);

            return { orderId: orderResult.lastInsertRowid, executedPrice: currentPrice, fees: brokerage };

          } else {
            const proceeds = turnover - brokerage;
            db.prepare('UPDATE users SET cash = cash + ? WHERE id = ?').run(proceeds, userId);

            const newQty = holding.quantity - quantity;
            if (newQty === 0) {
              db.prepare('DELETE FROM holdings WHERE id = ?').run(holding.id);
            } else {
              db.prepare('UPDATE holdings SET quantity = ? WHERE id = ?').run(newQty, holding.id);
            }

            const orderResult = db.prepare(`
              INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at, executed_at)
              VALUES (?, ?, ?, 'LIMIT', ?, ?, ?, 'EXECUTED', ?, ?, ?, ?)
            `).run(userId, symbol, side, quantity, limit_price, currentPrice, brokerage, cleanNote, now, now);

            return { orderId: orderResult.lastInsertRowid, executedPrice: currentPrice, fees: brokerage };
          }
        });

        const result = tx();
        const updatedUser = db.prepare('SELECT cash FROM users WHERE id = ?').get(userId);

        return res.status(201).json({
          message: `Limit order filled immediately at ₹${result.executedPrice.toFixed(2)} (better than limit of ₹${limit_price.toFixed(2)}).`,
          orderId: result.orderId,
          status: 'EXECUTED',
          executedPrice: result.executedPrice,
          fees: result.fees,
          newCashBalance: updatedUser.cash
        });

      } else {
        // Enqueue as PENDING
        const orderResult = db.prepare(`
          INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at)
          VALUES (?, ?, ?, 'LIMIT', ?, ?, NULL, 'PENDING', 0, ?, ?)
        `).run(userId, symbol, side, quantity, limit_price, cleanNote, now);

        return res.status(201).json({
          message: `Limit order placed successfully. Waiting for ${symbol} to reach ₹${limit_price.toFixed(2)}.`,
          orderId: orderResult.lastInsertRowid,
          status: 'PENDING',
          limitPrice: limit_price
        });
      }
    }
  } catch (err) {
    console.error('Order error:', err);
    return res.status(500).json({ error: 'Failed to process order. ' + err.message });
  }
});

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);

    // Attach latest market price for each symbol
    const enrichedOrders = orders.map(o => {
      const quote = getQuote(o.symbol);
      return {
        ...o,
        current_price: quote ? quote.currentPrice : null,
      };
    });

    res.json({ orders: enrichedOrders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// DELETE /api/orders/:id (Cancel pending limit order)
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot cancel an order that is already ${order.status}.` });
    }

    db.prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?").run(orderId);

    res.json({ message: 'Order cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
});

export default router;
