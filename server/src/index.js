import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { startPriceEngine } from './services/priceEngine.js';

import authRoutes from './routes/authRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import accountRoutes from './routes/accountRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
initDatabase();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
