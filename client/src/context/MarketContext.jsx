import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState(new Set());
  const [priceFlashes, setPriceFlashes] = useState({}); // symbol -> 'up' | 'down'
  const prevPricesRef = useRef(new Map());

  // Fetch Quotes
  const fetchQuotes = async () => {
    try {
      const res = await apiFetch('/api/quotes');
      if (!res.ok) return;
      const data = await res.json();

      setIsSimulated(data.isSimulated);
      setLastUpdated(data.timestamp);

      // Detect price flashes
      const newFlashes = {};
      data.quotes.forEach(q => {
        const prevPrice = prevPricesRef.current.get(q.symbol);
        if (prevPrice !== undefined && prevPrice !== q.currentPrice) {
          newFlashes[q.symbol] = q.currentPrice > prevPrice ? 'up' : 'down';
        }
        prevPricesRef.current.set(q.symbol, q.currentPrice);
      });

      if (Object.keys(newFlashes).length > 0) {
        setPriceFlashes(prev => ({ ...prev, ...newFlashes }));
        setTimeout(() => {
          setPriceFlashes(prev => {
            const next = { ...prev };
            Object.keys(newFlashes).forEach(s => delete next[s]);
            return next;
          });
        }, 1200);
      }

      setQuotes(data.quotes);
    } catch (err) {
      // Ignore network errors in polling
    }
  };

  // Fetch Watchlist
  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlistSymbols(new Set());
      return;
    }
    try {
      const res = await apiFetch('/api/watchlist');
      if (res.ok) {
        const data = await res.json();
        const set = new Set(data.watchlist.map(item => item.symbol));
        setWatchlistSymbols(set);
      }
    } catch (e) {
      // Ignore
    }
  };

  // Toggle Watchlist
  const toggleWatchlist = async (symbol) => {
    if (!user) return;
    const isPresent = watchlistSymbols.has(symbol);

    // Optimistic update
    setWatchlistSymbols(prev => {
      const next = new Set(prev);
      if (isPresent) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

    try {
      if (isPresent) {
        await apiFetch(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
      } else {
        await apiFetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        });
      }
    } catch (err) {
      // Revert if error
      fetchWatchlist();
    }
  };

  const isWatchlisted = (symbol) => watchlistSymbols.has(symbol);

  useEffect(() => {
    fetchQuotes();
    // Poll every 5 seconds as specified
    const quoteInterval = setInterval(fetchQuotes, 5000);
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  // Derived data
  const niftyQuote = quotes.find(q => q.symbol === '^NSEI') || null;
  const stockQuotes = quotes.filter(q => q.symbol !== '^NSEI');

  return (
    <MarketContext.Provider
      value={{
        quotes: stockQuotes,
        allQuotes: quotes,
        niftyQuote,
        isSimulated,
        lastUpdated,
        watchlistSymbols,
        isWatchlisted,
        toggleWatchlist,
        priceFlashes,
        refreshQuotes: fetchQuotes,
        refreshWatchlist: fetchWatchlist
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
