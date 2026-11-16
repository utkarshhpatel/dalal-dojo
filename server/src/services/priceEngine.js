import yahooFinance from 'yahoo-finance2';
import { POPULAR_STOCKS, SYMBOL_LOOKUP } from '../config/stocks.js';
import db from '../db/database.js';

try {
  yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);
} catch (e) {
  // Ignore suppression failure
}

// In-memory quote cache: Map<symbol, QuoteObject>
const quoteCache = new Map();

// Track overall market state
let isSimulated = true;
let lastYahooAttemptTime = 0;
let consecutiveYahooFailures = 0;

/**
 * Initialize baseline cache for all ~40 stocks + Nifty 50
 */
function initBaselineCache() {
  const now = new Date();
  for (const stock of POPULAR_STOCKS) {
    const base = stock.baselinePrice;
    const randomVariation = (Math.random() - 0.48) * 0.02; // slight realistic drift
    const prevClose = Math.round(base * 100) / 100;
    const currentPrice = Math.round((base * (1 + randomVariation)) * 100) / 100;
    const change = Math.round((currentPrice - prevClose) * 100) / 100;
    const changePercent = Math.round((change / prevClose) * 10000) / 100;
    const dayHigh = Math.max(currentPrice, prevClose * 1.012);
    const dayLow = Math.min(currentPrice, prevClose * 0.988);

    quoteCache.set(stock.symbol, {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      currentPrice: currentPrice,
      previousClose: prevClose,
      open: prevClose * (1 + (Math.random() - 0.5) * 0.005),
      dayHigh: Math.round(dayHigh * 100) / 100,
      dayLow: Math.round(dayLow * 100) / 100,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(100000 + Math.random() * 900000),
      lastUpdated: now.toISOString(),
      isSimulated: true
    });
  }
}

initBaselineCache();

/**
 * Simulate small random walk price movement (±0.05% to ±0.2%)
 */
export function tickSimulatedPrices() {
  const now = new Date();
  for (const stock of POPULAR_STOCKS) {
    const quote = quoteCache.get(stock.symbol);
    if (!quote) continue;

    // Small random delta between -0.2% and +0.2%
    const deltaPercent = (Math.random() - 0.495) * 0.0035; 
    let newPrice = Math.round((quote.currentPrice * (1 + deltaPercent)) * 100) / 100;
    if (newPrice <= 0) newPrice = quote.previousClose;

    const change = Math.round((newPrice - quote.previousClose) * 100) / 100;
    const changePercent = Math.round((change / quote.previousClose) * 10000) / 100;
    const dayHigh = Math.max(quote.dayHigh, newPrice);
    const dayLow = Math.min(quote.dayLow, newPrice);
    const volumeDelta = Math.floor(10 + Math.random() * 200);

    quoteCache.set(stock.symbol, {
      ...quote,
      currentPrice: newPrice,
      change: change,
      changePercent: changePercent,
      dayHigh: Math.round(dayHigh * 100) / 100,
      dayLow: Math.round(dayLow * 100) / 100,
      volume: quote.volume + volumeDelta,
      lastUpdated: now.toISOString(),
      isSimulated: isSimulated
    });
  }

  // Check pending limit orders against newly ticked prices
  checkAndExecutePendingOrders();
}

/**
 * Try to fetch quotes from Yahoo Finance
 */
export async function refreshQuotesFromYahoo() {
  const now = Date.now();
  // Don't hammer Yahoo if it is failing repeatedly (back off to 60s)
  if (consecutiveYahooFailures > 2 && now - lastYahooAttemptTime < 60000) {
    tickSimulatedPrices();
    return;
  }

  lastYahooAttemptTime = now;
  try {
    // Attempt batch quote for a subset or key symbols
    const symbolsToFetch = POPULAR_STOCKS.map(s => s.symbol);
    
    // Attempt quote
    const results = await Promise.race([
      yahooFinance.quote(symbolsToFetch),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Yahoo Finance timeout')), 5000))
    ]);

    if (Array.isArray(results) && results.length > 0) {
      let updatedCount = 0;
      for (const res of results) {
        if (!res || !res.symbol || !res.regularMarketPrice) continue;
        const meta = SYMBOL_LOOKUP.get(res.symbol) || { name: res.shortName || res.symbol, sector: 'NSE' };
        const price = res.regularMarketPrice;
        const prevClose = res.regularMarketPreviousClose || price;
        const change = res.regularMarketChange ?? Math.round((price - prevClose) * 100) / 100;
        const changePercent = res.regularMarketChangePercent ?? Math.round((change / prevClose) * 10000) / 100;

        quoteCache.set(res.symbol, {
          symbol: res.symbol,
          name: meta.name || res.shortName || res.symbol,
          sector: meta.sector || 'NSE',
          currentPrice: Math.round(price * 100) / 100,
          previousClose: Math.round(prevClose * 100) / 100,
          open: res.regularMarketOpen || prevClose,
          dayHigh: res.regularMarketDayHigh || price,
          dayLow: res.regularMarketDayLow || price,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          volume: res.regularMarketVolume || 500000,
          lastUpdated: new Date().toISOString(),
          isSimulated: false
        });
        updatedCount++;
      }

      if (updatedCount > 0) {
        isSimulated = false;
        consecutiveYahooFailures = 0;
        checkAndExecutePendingOrders();
        return;
      }
    }
    throw new Error('No valid quotes returned');
  } catch (err) {
    consecutiveYahooFailures++;
    isSimulated = true;
    // Fallback to simulated random walk
    tickSimulatedPrices();
  }
}

/**
 * Check and execute pending limit orders inside atomic transactions
 */
export function checkAndExecutePendingOrders() {
  try {
    const pendingOrders = db.prepare(`
      SELECT o.*, u.cash, h.quantity as held_quantity, h.avg_price as held_avg_price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN holdings h ON h.user_id = o.user_id AND h.symbol = o.symbol
      WHERE o.status = 'PENDING'
    `).all();

    if (!pendingOrders || pendingOrders.length === 0) return;

    for (const order of pendingOrders) {
      const quote = quoteCache.get(order.symbol);
      if (!quote) continue;

      const currentPrice = quote.currentPrice;
      let shouldExecute = false;

      if (order.side === 'BUY' && currentPrice <= order.limit_price) {
        shouldExecute = true;
      } else if (order.side === 'SELL' && currentPrice >= order.limit_price) {
        shouldExecute = true;
      }

      if (shouldExecute) {
        executeLimitOrder(order, currentPrice);
      }
    }
  } catch (err) {
    console.error('Error checking pending limit orders:', err.message);
  }
}

/**
 * Executes a limit order atomically
 */
function executeLimitOrder(order, executionPrice) {
  const turnover = order.quantity * executionPrice;
  // Brokerage: ₹20 or 0.03% whichever is lower
  const brokerage = Math.round(Math.min(20, turnover * 0.0003) * 100) / 100;
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    if (order.side === 'BUY') {
      const totalCost = turnover + brokerage;
      if (order.cash < totalCost) {
        // Insufficient cash at execution time, cancel order
        db.prepare(`
          UPDATE orders 
          SET status = 'CANCELLED', note = COALESCE(note || ' ', '') || '[System: Insufficient funds at execution]' 
          WHERE id = ?
        `).run(order.id);
        return;
      }

      // Deduct cash
      db.prepare(`UPDATE users SET cash = cash - ? WHERE id = ?`).run(totalCost, order.user_id);

      // Upsert holding
      const existingHolding = db.prepare(`SELECT * FROM holdings WHERE user_id = ? AND symbol = ?`).get(order.user_id, order.symbol);
      if (existingHolding) {
        const newQty = existingHolding.quantity + order.quantity;
        const newAvgPrice = Math.round(((existingHolding.quantity * existingHolding.avg_price) + turnover) / newQty * 100) / 100;
        db.prepare(`UPDATE holdings SET quantity = ?, avg_price = ? WHERE id = ?`).run(newQty, newAvgPrice, existingHolding.id);
      } else {
        db.prepare(`INSERT INTO holdings (user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?)`).run(order.user_id, order.symbol, order.quantity, executionPrice);
      }

      // Mark order executed
      db.prepare(`
        UPDATE orders 
        SET status = 'EXECUTED', executed_price = ?, fees = ?, executed_at = ?
        WHERE id = ?
      `).run(executionPrice, brokerage, now, order.id);

    } else if (order.side === 'SELL') {
      const proceeds = turnover - brokerage;
      const holding = db.prepare(`SELECT * FROM holdings WHERE user_id = ? AND symbol = ?`).get(order.user_id, order.symbol);

      if (!holding || holding.quantity < order.quantity) {
        // Not enough shares to sell, cancel order
        db.prepare(`
          UPDATE orders 
          SET status = 'CANCELLED', note = COALESCE(note || ' ', '') || '[System: Insufficient holdings at execution]' 
          WHERE id = ?
        `).run(order.id);
        return;
      }

      // Add cash
      db.prepare(`UPDATE users SET cash = cash + ? WHERE id = ?`).run(proceeds, order.user_id);

      // Deduct holding
      const remainingQty = holding.quantity - order.quantity;
      if (remainingQty === 0) {
        db.prepare(`DELETE FROM holdings WHERE id = ?`).run(holding.id);
      } else {
        db.prepare(`UPDATE holdings SET quantity = ? WHERE id = ?`).run(remainingQty, holding.id);
      }

      // Mark order executed
      db.prepare(`
        UPDATE orders 
        SET status = 'EXECUTED', executed_price = ?, fees = ?, executed_at = ?
        WHERE id = ?
      `).run(executionPrice, brokerage, now, order.id);
    }
  });

  try {
    tx();
  } catch (err) {
    console.error(`Transaction failed executing order ${order.id}:`, err.message);
  }
}

/**
 * Get all cached quotes
 */
export function getAllQuotes() {
  return {
    isSimulated,
    timestamp: new Date().toISOString(),
    quotes: Array.from(quoteCache.values())
  };
}

/**
 * Get single quote
 */
export function getQuote(symbol) {
  const quote = quoteCache.get(symbol);
  if (!quote) return null;
  return {
    ...quote,
    isSimulated
  };
}

/**
 * Generate synthetic historical candles for TradingView lightweight-charts
 */
export function generateSyntheticCandles(symbol, range = '1D') {
  const quote = quoteCache.get(symbol) || {
    currentPrice: 1000,
    previousClose: 1000,
    dayHigh: 1020,
    dayLow: 980
  };

  const candles = [];
  const now = new Date();
  const currentPrice = quote.currentPrice;

  if (range === '1D') {
    // 5-minute candles for intraday (from 09:15 to 15:30 IST)
    // ~75 candles
    const count = 75;
    const intervalSeconds = 300; // 5 min
    let price = quote.previousClose || currentPrice;
    const stepTarget = (currentPrice - price) / count;

    const startTime = Math.floor(now.getTime() / 1000) - (count * intervalSeconds);

    for (let i = 0; i < count; i++) {
      const time = startTime + (i * intervalSeconds);
      const open = price;
      const noise = (Math.random() - 0.48) * (price * 0.004);
      const close = i === count - 1 ? currentPrice : Math.round((price + stepTarget + noise) * 100) / 100;
      const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.003) * 100) / 100;
      const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.003) * 100) / 100;
      const volume = Math.floor(5000 + Math.random() * 25000);

      candles.push({ time, open, high, low, close, volume });
      price = close;
    }
  } else {
    // Daily candles
    let days = 30;
    if (range === '6M') days = 180;
    if (range === '1Y') days = 365;

    let price = currentPrice * (1 - (Math.random() * 0.15 - 0.05)); // start near current
    const daySeconds = 86400;
    const startTime = Math.floor(now.getTime() / 1000) - (days * daySeconds);
    const stepTarget = (currentPrice - price) / days;

    for (let i = 0; i < days; i++) {
      const time = startTime + (i * daySeconds);
      const open = Math.round(price * 100) / 100;
      const drift = stepTarget + (Math.random() - 0.49) * (price * 0.018);
      const close = i === days - 1 ? currentPrice : Math.round((open + drift) * 100) / 100;
      const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.012) * 100) / 100;
      const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.012) * 100) / 100;
      const volume = Math.floor(100000 + Math.random() * 800000);

      candles.push({ time, open, high, low, close, volume });
      price = close;
    }
  }

  return candles;
}

/**
 * Fetch candles with Yahoo chart() and synthetic fallback
 */
export async function getHistoricalCandles(symbol, range = '1D') {
  try {
    let queryOptions = { period1: '1d', interval: '5m' };
    if (range === '1M') queryOptions = { period1: '1mo', interval: '1d' };
    if (range === '6M') queryOptions = { period1: '6mo', interval: '1d' };
    if (range === '1Y') queryOptions = { period1: '1y', interval: '1wk' };

    const chartRes = await Promise.race([
      yahooFinance.chart(symbol, queryOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chart timeout')), 4000))
    ]);

    if (chartRes && chartRes.quotes && chartRes.quotes.length > 0) {
      const formatted = chartRes.quotes
        .filter(q => q.open && q.close && q.high && q.low)
        .map(q => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          open: Math.round(q.open * 100) / 100,
          high: Math.round(q.high * 100) / 100,
          low: Math.round(q.low * 100) / 100,
          close: Math.round(q.close * 100) / 100,
          volume: q.volume || 10000
        }));

      if (formatted.length > 0) {
        return formatted;
      }
    }
  } catch (err) {
    // Fall back to synthetic candles
  }

  return generateSyntheticCandles(symbol, range);
}

// Start background price update loop
export function startPriceEngine() {
  console.log('Price engine started (10s refresh interval with instant simulated ticks)');
  
  // Initial refresh attempt
  refreshQuotesFromYahoo();

  // Every 10 seconds, attempt Yahoo or tick simulated
  setInterval(() => {
    refreshQuotesFromYahoo();
  }, 10000);

  // Every 3 seconds, do a slight simulated price tick for active live feel
  setInterval(() => {
    tickSimulatedPrices();
  }, 3000);
}
