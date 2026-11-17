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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevPricesRef = useRef(new Map());

  // Fetch Quotes
  const fetchQuotes = async () => {
    try {
      const res = await apiFetch('/api/quotes');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.quotes)) {
        throw new Error('Invalid market data format received from backend.');
      }

      setIsSimulated(Boolean(data.isSimulated));
      setLastUpdated(data.timestamp);
      setError(null);

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
      console.warn('Market quotes fetch warning:', err.message);
      // Only set blocking error if we don't have any quotes yet
      setQuotes(prev => {
        if (prev.length === 0) {
          setError(err.message || 'Unable to connect to market server.');
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  const retryFetchQuotes = async () => {
    setLoading(true);
    setError(null);
    await fetchQuotes();
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
        loading,
        error,
        isOnline: Boolean(!error && quotes.length > 0),
        retryFetchQuotes,
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
