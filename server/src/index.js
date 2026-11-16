import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db/database.js';
import { startPriceEngine } from './services/priceEngine.js';

import authRoutes from './routes/authRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import accountRoutes from './routes/accountRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (e.g. Render, Heroku) for secure cookies & client IP
app.set('trust proxy', 1);

// Initialize Database
initDatabase();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('.vercel.app') || hostname === 'localhost') {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid URL
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/account', accountRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Dalal Dojo Backend'
  });
});

// Start Price Engine
startPriceEngine();

// Start Server
app.listen(PORT, () => {
  console.log(`Dalal Dojo Server listening on port ${PORT}`);
});
