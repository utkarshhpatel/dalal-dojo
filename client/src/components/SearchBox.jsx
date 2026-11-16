import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import CompanyAvatar from './CompanyAvatar';
import { formatINR, formatPercent } from '../utils/formatters';

export default function SearchBox({ className = '' }) {
  const { quotes } = useMarket();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        const tagName = document.activeElement?.tagName?.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching stocks
  const matches = query.trim()
    ? quotes
        .filter(
          s =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleSelect = (symbol) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/stock/${symbol}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" strokeWidth={1.5} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stocks, indices, companies..."
          className="w-full bg-bg-subtle text-heading placeholder-muted text-xs sm:text-sm pl-9 pr-12 py-2 rounded-input border border-transparent focus:border-border-focus focus:bg-bg-input focus:outline-none transition-all duration-150"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-muted hover:text-main p-0.5"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-2xs font-medium text-muted bg-bg-card border border-border rounded pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border rounded-card shadow-card z-50 overflow-hidden divide-y divide-border animate-fadeIn">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted text-center">
              No stocks found for "{query}"
            </div>
          ) : (
            matches.map(stock => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-bg-subtle cursor-pointer transition-colors duration-120"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-heading truncate">
                        {stock.name}
                      </div>
                      <div className="text-2xs text-muted">
                        {stock.symbol.replace('.NS', '')} · NSE
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-heading tabular-nums">
                      {formatINR(stock.currentPrice)}
                    </div>
                    <div className={`text-2xs tabular-nums font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? '+' : ''}{formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
