import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbPath = path.resolve(__dirname, '../../data/dalaldojo.db');
const dbPath = process.env.DB_PATH || process.env.DATABASE_PATH || defaultDbPath;
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode and foreign key constraints
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      cash REAL NOT NULL DEFAULT 1000000.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      avg_price REAL NOT NULL CHECK(avg_price >= 0),
      UNIQUE(user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
      type TEXT NOT NULL CHECK(type IN ('MARKET', 'LIMIT')),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      limit_price REAL,
      executed_price REAL,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
      fees REAL NOT NULL DEFAULT 0.0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_pending_orders ON orders(status) WHERE status = 'PENDING';
  `;

  db.exec(schema);
  console.log('Database initialized successfully at:', dbPath);

  // Safe non-destructive initial seeding (only if database has 0 users)
  import('./seed.js').then(({ seedData }) => {
    seedData(db, false).catch(err => {
      console.warn('[DB] Non-blocking safeSeed notice:', err.message);
    });
  }).catch(() => {});
}

export default db;
