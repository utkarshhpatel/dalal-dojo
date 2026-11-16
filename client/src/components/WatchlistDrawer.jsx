import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, ArrowRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import CompanyAvatar from './CompanyAvatar';
import PriceText from './PriceText';
import { formatPercent } from '../utils/formatters';

export default function WatchlistDrawer({ isOpen, onClose }) {
  const { quotes, watchlistSymbols, toggleWatchlist } = useMarket();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const watchlistedStocks = quotes.filter(q => watchlistSymbols.has(q.symbol));

  const handleSelect = (symbol) => {
    onClose();
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-180"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-bg-card border-l border-border shadow-xl flex flex-col animate-slideInRight duration-180">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-heading">Your Watchlist</h2>
              <span className="text-2xs text-muted font-medium">({watchlistedStocks.length})</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-muted hover:text-main rounded-btn hover:bg-bg-subtle transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {watchlistedStocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted space-y-2">
                <p>Your watchlist is empty.</p>
                <p className="text-2xs text-subtle leading-relaxed">
                  Click the star icon next to any stock on the Explore page or stock detail to pin it here.
                </p>
              </div>
            ) : (
              watchlistedStocks.map(stock => {
                const isPositive = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol)}
                    className="flex items-center justify-between p-3.5 hover:bg-bg-subtle cursor-pointer transition-colors duration-120 group"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-heading group-hover:text-primary transition-colors truncate">
                          {stock.name}
                        </div>
                        <div className="text-2xs text-muted">
                          {stock.symbol.replace('.NS', '')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-heading">
                          <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                        </div>
                        <div className={`text-2xs font-medium tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
                          {isPositive ? '+' : ''}{formatPercent(stock.changePercent)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(stock.symbol);
                        }}
                        className="text-amber-500 hover:text-muted p-1 transition-colors"
                        title="Remove from watchlist"
                        aria-label="Remove from watchlist"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
