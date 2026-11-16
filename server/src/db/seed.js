import bcrypt from 'bcryptjs';
import db, { initDatabase } from './database.js';
import { POPULAR_STOCKS } from '../config/stocks.js';

async function seed() {
  console.log('Seeding Dalal Dojo database...');
  initDatabase();

  const salt = await bcrypt.genSalt(10);
  const demoPassHash = await bcrypt.hash('demo123', salt);
  const commonPassHash = await bcrypt.hash('password123', salt);

  const usersData = [
    {
      username: 'demo',
      password_hash: demoPassHash,
      cash: 724850.00,
      holdings: [
        { symbol: 'RELIANCE.NS', quantity: 25, avg_price: 2910.00 },
        { symbol: 'TCS.NS', quantity: 15, avg_price: 4050.00 },
        { symbol: 'HDFCBANK.NS', quantity: 40, avg_price: 1680.50 },
        { symbol: 'ZOMATO.NS', quantity: 150, avg_price: 242.00 }
      ],
      orders: [
        {
          symbol: 'RELIANCE.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 25,
          limit_price: null,
          executed_price: 2910.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'Fundamental buy: Strong retail and telecom cash flow growth.',
          created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 6 * 86400000).toISOString()
        },
        {
          symbol: 'TCS.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 15,
          limit_price: null,
          executed_price: 4050.00,
          status: 'EXECUTED',
          fees: 18.22,
          note: 'Large-cap IT leader with resilient deal wins and defensive cash flow.',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          symbol: 'HDFCBANK.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 40,
          limit_price: null,
          executed_price: 1680.50,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'Attractive valuation post-merger; deposit growth picking up pace.',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          symbol: 'ZOMATO.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 150,
          limit_price: null,
          executed_price: 242.00,
          status: 'EXECUTED',
          fees: 10.89,
          note: 'Quick commerce Blinkit hypergrowth turning EBITDA positive.',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 1 * 86400000).toISOString()
        },
        {
          symbol: 'INFY.NS',
          side: 'BUY',
          type: 'LIMIT',
          quantity: 20,
          limit_price: 1840.00,
          executed_price: null,
          status: 'PENDING',
          fees: 0,
          note: 'Waiting for pullback to support zone near ₹1,840.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          executed_at: null
        }
      ],
      watchlist: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'TATAMOTORS.NS', 'ZOMATO.NS']
    },
    {
      username: 'Aarav',
      password_hash: commonPassHash,
      cash: 685000.00,
      holdings: [
        { symbol: 'TRENT.NS', quantity: 30, avg_price: 6400.00 },
        { symbol: 'ZOMATO.NS', quantity: 600, avg_price: 220.00 },
        { symbol: 'HAL.NS', quantity: 20, avg_price: 4100.00 }
      ],
      orders: [
        {
          symbol: 'TRENT.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 30,
          limit_price: null,
          executed_price: 6400.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'Zudio store expansion momentum continuing aggressively.',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ],
      watchlist: ['TRENT.NS', 'ZOMATO.NS', 'HAL.NS']
    },
    {
      username: 'Priya',
      password_hash: commonPassHash,
      cash: 742000.00,
      holdings: [
        { symbol: 'ICICIBANK.NS', quantity: 60, avg_price: 1205.00 },
        { symbol: 'TATAMOTORS.NS', quantity: 100, avg_price: 940.00 },
        { symbol: 'SUNPHARMA.NS', quantity: 45, avg_price: 1750.00 }
      ],
      orders: [
        {
          symbol: 'TATAMOTORS.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 100,
          limit_price: null,
          executed_price: 940.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'JLR order book healthy and commercial vehicles cyclical upturn.',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ],
      watchlist: ['ICICIBANK.NS', 'TATAMOTORS.NS', 'SUNPHARMA.NS']
    },
    {
      username: 'Rohan',
      password_hash: commonPassHash,
      cash: 795000.00,
      holdings: [
        { symbol: 'ITC.NS', quantity: 300, avg_price: 470.00 },
        { symbol: 'TATASTEEL.NS', quantity: 400, avg_price: 148.00 }
      ],
      orders: [
        {
          symbol: 'ITC.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 300,
          limit_price: null,
          executed_price: 470.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'High dividend yield and FMCG margin expansion.',
          created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 8 * 86400000).toISOString()
        }
      ],
      watchlist: ['ITC.NS', 'TATASTEEL.NS']
    },
    {
      username: 'Sneha',
      password_hash: commonPassHash,
      cash: 830000.00,
      holdings: [
        { symbol: 'SBIN.NS', quantity: 120, avg_price: 810.00 },
        { symbol: 'BEL.NS', quantity: 240, avg_price: 285.00 }
      ],
      orders: [
        {
          symbol: 'SBIN.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 120,
          limit_price: null,
          executed_price: 810.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'PSU banking valuation re-rating and clean balance sheet.',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 4 * 86400000).toISOString()
        }
      ],
      watchlist: ['SBIN.NS', 'BEL.NS']
    },
    {
      username: 'Karthik',
      password_hash: commonPassHash,
      cash: 710000.00,
      holdings: [
        { symbol: 'TITAN.NS', quantity: 35, avg_price: 3300.00 },
        { symbol: 'MARUTI.NS', quantity: 12, avg_price: 11950.00 }
      ],
      orders: [
        {
          symbol: 'TITAN.NS',
          side: 'BUY',
          type: 'MARKET',
          quantity: 35,
          limit_price: null,
          executed_price: 3300.00,
          status: 'EXECUTED',
          fees: 20.00,
          note: 'Festive season wedding jewellery demand surge expected.',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          executed_at: new Date(Date.now() - 3 * 86400000).toISOString()
        }
      ],
      watchlist: ['TITAN.NS', 'MARUTI.NS']
    }
  ];

  // Clear existing demo tables
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM watchlist').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM holdings').run();
    db.prepare('DELETE FROM users').run();

    for (const u of usersData) {
      const userRes = db.prepare(`
        INSERT INTO users (username, password_hash, cash)
        VALUES (?, ?, ?)
      `).run(u.username, u.password_hash, u.cash);
      const userId = userRes.lastInsertRowid;

      for (const h of u.holdings) {
        db.prepare(`
          INSERT INTO holdings (user_id, symbol, quantity, avg_price)
          VALUES (?, ?, ?, ?)
        `).run(userId, h.symbol, h.quantity, h.avg_price);
      }

      for (const o of u.orders) {
        db.prepare(`
          INSERT INTO orders (user_id, symbol, side, type, quantity, limit_price, executed_price, status, fees, note, created_at, executed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          o.symbol,
          o.side,
          o.type,
          o.quantity,
          o.limit_price,
          o.executed_price,
          o.status,
          o.fees,
          o.note,
          o.created_at,
          o.executed_at
        );
      }

      for (const w of u.watchlist) {
        db.prepare(`
          INSERT INTO watchlist (user_id, symbol)
          VALUES (?, ?)
        `).run(userId, w);
      }
    }
  });

  tx();
  console.log('Seeded successfully with 6 users (including demo) and realistic portfolios!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
