# Dalal Dojo (दलाल डोजो)

> **Paper-Trading Platform for Indian Beginners — Inspired by Zerodha Kite & Groww**

Dalal Dojo is a high-performance, hackathon-ready virtual stock trading platform that empowers Indian retail beginners to trade National Stock Exchange (NSE) equities using ₹10,00,000 in virtual capital. Designed with the aesthetics of professional trading terminals, it features real-time price simulations, TradingView charts, atomic order execution, limit order automation, trade journaling, and portfolio risk analytics.

---

## Quick Start (Demo-Ready in One Command)

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation & Launch

```bash
# 1. Install all dependencies (root, server, and client)
npm run install:all

# 2. Seed realistic demo data (5 Indian traders + demo account)
npm run seed

# 3. Start both backend and frontend concurrently
npm run dev
```

The application will be live at:
- **Frontend Trading Terminal**: `http://localhost:5173`
- **Backend API & Price Engine**: `http://localhost:5000`

### Demo Credentials
- **Username**: `demo`
- **Password**: `demo123`
*(A 1-click "Fill Demo" button is also provided directly on the login page)*

---

## Screenshots Placeholder

```
+---------------------------------------------------------------------------------+
|  DALAL DOJO  | NIFTY 50: 24,590.02 (+1.04%) | Market: Simulated | Cash: ₹7,24,850|
+---------------------------------------------------------------------------------+
| [Watchlist]      |  RELIANCE.NS - Reliance Industries Ltd                       |
| RELIANCE ₹2,980  |  LTP: ₹2,980.50 (+1.2%)   [BUY] [SELL]                       |
| TCS      ₹4,140  |  +---------------------------------------------------------+ |
| HDFCBANK ₹1,720  |  |  [TradingView Candlestick Chart: 1D | 1M | 6M | 1Y]    | |
| INFY     ₹1,870  |  |  [Volume Histogram]                                     | |
| ZOMATO   ₹265    |  +---------------------------------------------------------+ |
| TRENT    ₹6,850  |  Day Range: L ₹2,940.00 ----------^---------- H ₹2,995.00   |
| TATAMOTORS ₹980  |  You hold 25 shares. Unrealized P&L: +₹2,536.50 (+3.49%)    |
+---------------------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6 | High-speed hot reloading, SPA client routing |
| **Styling** | Tailwind CSS | Custom dark terminal theme (`#0f1115`, `#171a21`, `#2dd4bf`) |
| **Typography** | Inter & JetBrains Mono | JetBrains Mono tabular numbers for aligned financial prices |
| **Charts** | `lightweight-charts` v4 | Official TradingView canvas charting library |
| **Backend** | Node.js, Express (ES Modules) | Lightweight REST API and asynchronous price engine |
| **Database** | SQLite via `better-sqlite3` | Zero-setup embedded DB with WAL mode & atomic transactions |
| **Authentication**| JWT stored in `httpOnly` cookie | Secure session storage, bcrypt password hashing |
| **Market Data** | `yahoo-finance2` + Random Walk | Real NSE quotes with automatic fallback simulation |

---

## Price Engine & High-Resilience Fallback

1. **Fixed Universe**: Actively monitors ~40 major NSE liquid stocks (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, SBI, Tata Motors, ITC, Zomato, Trent, etc.) and the Nifty 50 Index (`^NSEI`).
2. **In-Memory Cache**: Cached in RAM and polled by the client every 5 seconds.
3. **Automated Fallback**:
   - If Yahoo Finance rate-limits, errors, or if the market is closed, the server automatically switches to **Simulated Mode**.
   - Applies a continuous random walk ($\pm 0.05\%$ to $\pm 0.2\%$) to simulate an active market day with volume.
   - An honest badge in the top navbar dynamically signals **"Live"** (green) vs **"Simulated"** (amber).
4. **Historical Candles**: Fetches candles for `1D` (5m), `1M` (daily), `6M` (daily), `1Y` (weekly). Generates authentic synthetic candles if external APIs are unreachable.

---

## Core Features

1. **Authentication & Virtual Funds**:
   - Every new registration is automatically credited with **₹10,00,000** in paper trading cash.
2. **Market Discovery**:
   - Searchable, sector-filterable table with live Last Traded Price (LTP), day change (₹ and %), day high/low, and volume.
   - Prices visually flash green or red on ticks.
3. **Stock Detail & TradingView Charts**:
   - Interactive candlestick chart with range selector tabs (`1D`, `1M`, `6M`, `1Y`).
   - Intraday high/low range progress bar and key fundamentals.
4. **Order Execution & Realistic Brokerage**:
   - Instant **Market Orders** executed at live cached prices.
   - Realistic Indian brokerage deducted: **₹20 or 0.03%** (whichever is lower).
   - Strict validation preventing negative cash balances or naked shorting.
5. **Automated Limit Orders**:
   - Users can set a target price for BUY (triggers when price $\le$ limit) or SELL (triggers when price $\ge$ limit).
   - Background price engine checks and executes pending limit orders inside atomic SQLite transactions.
   - Pending orders page with instant cancellation.
6. **Live Portfolio & Allocation**:
   - Holdings table with real-time LTP, average price, invested capital, current valuation, and unrealized P&L.
   - Custom SVG **Allocation Donut** displaying stock distribution and liquid cash.
7. **Kite-Style Watchlist**:
   - Persistent left sidebar with 1-click star toggle and quick "B" / "S" trading buttons.
8. **Live Leaderboard**:
   - Ranks all traders by dynamic portfolio return percentage against the starting ₹10L capital.
9. **One-Click Account Reset**:
   - Restores the account to initial state (₹10,00,000 cash, wipes holdings and orders).

---

## The Learning Twist (Educational Edge)

- **Trade Journaling**: Prompts an optional rationale on every BUY (e.g., *"Breakout from 200 EMA with heavy volume"*). Rationales are stored and displayed in trade history alongside realized outcomes.
- **Trader Win Rate Metrics**: Evaluates closed positions to display Win Rate %, Average Gain %, and Average Loss %.
- **Diversification Risk Warning**: Displays a gentle amber alert if any single stock position exceeds **40%** of total portfolio net worth.
- **Beginner Educational Tooltips**: Small `?` icons explaining financial concepts (*LTP*, *P&L*, *Limit vs Market*, *Brokerage*, *Concentration Risk*) in plain, accessible language.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/signup` | Register new user with ₹10,00,000 cash | No |
| `POST` | `/api/auth/login` | Login and set `httpOnly` JWT cookie | No |
| `POST` | `/api/auth/logout` | Clear auth cookie | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/quotes` | Get all cached quotes + simulated flag | No |
| `GET` | `/api/quotes/:symbol` | Get single stock quote | No |
| `GET` | `/api/quotes/history/:symbol` | Get OHLCV candlestick data (`?range=1D\|1M\|6M\|1Y`) | No |
| `POST` | `/api/orders` | Place Market or Limit order | Yes |
| `GET` | `/api/orders` | List executed history and pending orders | Yes |
| `DELETE` | `/api/orders/:id` | Cancel a pending limit order | Yes |
| `GET` | `/api/portfolio` | Real-time portfolio valuation & allocation | Yes |
| `GET` | `/api/watchlist` | Get user's starred stocks | Yes |
| `POST` | `/api/watchlist` | Add stock to watchlist | Yes |
| `DELETE` | `/api/watchlist/:symbol` | Remove stock from watchlist | Yes |
| `GET` | `/api/leaderboard` | Top 20 ranked traders by return % | No |
| `POST` | `/api/account/reset` | Reset account to ₹10,00,000 cash | Yes |

---

## Database Schema (SQLite)

```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  cash REAL NOT NULL DEFAULT 1000000.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  avg_price REAL NOT NULL CHECK(avg_price >= 0),
  UNIQUE(user_id, symbol)
);

orders (
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

watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, symbol)
);
```

---

## Seed Data Included

Running `npm run seed` creates:
- `demo` (password: `demo123`, diversified holdings in Reliance, TCS, HDFC Bank, Zomato, with journal notes)
- `Aarav` (top gainer, heavy tech portfolio)
- `Priya` (banking & auto: HDFC Bank, ICICI Bank, Tata Motors)
- `Rohan` (FMCG & energy: ITC, Tata Steel)
- `Sneha` (conservative portfolio: SBI, BEL)
- `Karthik` (active swing trader: Titan, Maruti)

---

## Quality & Design Standards
- Zero emojis in the UI. All indicators use clean geometric SVGs from Lucide.
- Tabular figures (`JetBrains Mono tabular-nums`) prevent price jittering.
- Indian numbering convention: `₹1,23,456.50`.
- All database state mutations use atomic SQLite transactions to prevent race conditions or balance desynchronization.
