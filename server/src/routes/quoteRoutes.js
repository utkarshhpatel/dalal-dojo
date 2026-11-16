import express from 'express';
import { getAllQuotes, getQuote, getHistoricalCandles } from '../services/priceEngine.js';

const router = express.Router();

// GET /api/quotes
router.get('/', (req, res) => {
  try {
    const data = getAllQuotes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes.' });
  }
});

// GET /api/quotes/:symbol
router.get('/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = getQuote(symbol.toUpperCase());
    if (!quote) {
      return res.status(404).json({ error: `Quote for symbol ${symbol} not found.` });
    }
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock quote.' });
  }
});

// GET /api/history/:symbol
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = (req.query.range || '1D').toUpperCase();
    const candles = await getHistoricalCandles(symbol.toUpperCase(), range);
    res.json({
      symbol: symbol.toUpperCase(),
      range,
      candles
    });
  } catch (err) {
    console.error('Error fetching candles:', err);
    res.status(500).json({ error: 'Failed to fetch historical candles.' });
  }
});

export default router;
