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
  'https://dalaldojo.vercel.app',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (
        hostname.endsWith('.vercel.app') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid URL
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Health check endpoints (available at both /health and /api/health)
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Dalal Dojo Backend',
    database: 'connected',
    env: process.env.NODE_ENV || 'development'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/account', accountRoutes);

// Root route for pinging backend
app.get('/', (req, res) => {
  res.json({
    name: 'Dalal Dojo API',
    status: 'running',
    health: '/health',
    quotes: '/api/quotes'
  });
});

// Start Price Engine
startPriceEngine();

// Start Server (explicitly binding to 0.0.0.0 for cloud hosting)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dalal Dojo Server listening on 0.0.0.0:${PORT}`);
});
