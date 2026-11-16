import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import CompanyAvatar from '../components/CompanyAvatar';
import PriceText from '../components/PriceText';
import Sparkline from '../components/Sparkline';
import { formatINR, formatPercent, formatNumber } from '../utils/formatters';

export default function MarketPage() {
  const { quotes, niftyQuote, watchlistSymbols, isWatchlisted, toggleWatchlist } = useMarket();
  const navigate = useNavigate();

  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sortBy, setSortBy] = useState('volume'); // 'volume' | 'changePercent' | 'currentPrice' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Extract unique sectors
  const sectors = useMemo(() => {
    return ['ALL', ...new Set(quotes.map(q => q.sector).filter(Boolean))];
  }, [quotes]);

  // Derived indices
  const indices = useMemo(() => {
    const nifty = niftyQuote || {
      name: 'Nifty 50',
      currentPrice: 24590.02,
      change: 240.02,
      changePercent: 0.99
    };

    // Dynamic Bank Nifty calculation from banking stocks
    const bankingStocks = quotes.filter(q => q.sector === 'Banking');
    const bankPrice = bankingStocks.length > 0
      ? bankingStocks.reduce((acc, s) => acc + s.currentPrice, 0) / bankingStocks.length * 35.2
      : 51240.00;
    const bankChangePct = bankingStocks.length > 0
      ? bankingStocks.reduce((acc, s) => acc + s.changePercent, 0) / bankingStocks.length
      : 0.85;

    // Dynamic Nifty IT calculation from IT stocks
    const itStocks = quotes.filter(q => q.sector === 'IT Services');
    const itPrice = itStocks.length > 0
      ? itStocks.reduce((acc, s) => acc + s.currentPrice, 0) / itStocks.length * 18.4
      : 42180.00;
    const itChangePct = itStocks.length > 0
      ? itStocks.reduce((acc, s) => acc + s.changePercent, 0) / itStocks.length
      : -0.42;

    return [
      {
        id: 'nifty',
        name: 'NIFTY 50',
        price: nifty.currentPrice,
        change: nifty.change,
        changePercent: nifty.changePercent,
        isPositive: nifty.changePercent >= 0
      },
      {
        id: 'banknifty',
        name: 'BANK NIFTY',
        price: bankPrice,
        change: bankPrice * (bankChangePct / 100),
        changePercent: bankChangePct,
        isPositive: bankChangePct >= 0
      },
      {
        id: 'niftyit',
        name: 'NIFTY IT',
        price: itPrice,
        change: itPrice * (itChangePct / 100),
        changePercent: itChangePct,
        isPositive: itChangePct >= 0
      }
    ];
  }, [niftyQuote, quotes]);

  // Top Gainers & Losers (5 each)
  const topGainers = useMemo(() => {
    return [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  }, [quotes]);

  const topLosers = useMemo(() => {
    return [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  }, [quotes]);

  // Most Traded (top 4 by volume)
  const mostTraded = useMemo(() => {
    return [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 4);
  }, [quotes]);

  // Watchlisted Stocks
  const watchlistedStocks = useMemo(() => {
    return quotes.filter(q => watchlistSymbols.has(q.symbol));
  }, [quotes, watchlistSymbols]);

  // Filtered & Sorted All Stocks Table
  const filteredStocks = useMemo(() => {
    let result = quotes.filter(stock => {
      return selectedSector === 'ALL' || stock.sector === selectedSector;
    });

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [quotes, selectedSector, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-8 page-transition pb-16">
      {/* 1. Top Row: 3 Index Cards with Sparkline */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {indices.map(idx => (
            <div
              key={idx.id}
              className="bg-bg-card border border-border rounded-card p-4 shadow-card flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-muted font-medium">{idx.name}</span>
                <div className="text-base font-semibold text-heading tabular-nums mt-0.5">
                  {formatINR(idx.price, false)}
                </div>
                <div className={`text-2xs font-medium tabular-nums mt-0.5 ${idx.isPositive ? 'text-gain' : 'text-loss'}`}>
                  {idx.isPositive ? '+' : ''}{idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
                </div>
              </div>

              <Sparkline isPositive={idx.isPositive} width={76} height={28} />
            </div>
          ))}
        </div>
      </section>

      {/* 2. Your Watchlist (Horizontal scrollable compact cards, only if has items) */}
      {watchlistedStocks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-heading">Your watchlist</h2>
            <span className="text-2xs text-muted">{watchlistedStocks.length} stocks</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {watchlistedStocks.map(stock => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="min-w-[170px] bg-bg-card border border-border hover:border-border-focus rounded-card p-3 shadow-card cursor-pointer transition-all duration-120 group shrink-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(stock.symbol);
                      }}
                      className="text-amber-500 hover:text-muted p-0.5 transition-colors"
                      aria-label="Remove from watchlist"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-heading truncate group-hover:text-primary transition-colors">
                    {stock.name}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-semibold text-heading">
                      <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                    </span>
                    <span className={`text-2xs font-medium tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? '+' : ''}{formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Most Traded Section */}
      <section>
        <h2 className="text-sm font-semibold text-heading mb-3">Most traded stocks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mostTraded.map(stock => {
            const isPositive = stock.change >= 0;
            return (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="bg-bg-card border border-border hover:border-border-focus rounded-card p-3.5 shadow-card cursor-pointer transition-all duration-120 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                  <Sparkline isPositive={isPositive} width={52} height={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-heading truncate group-hover:text-primary transition-colors">
                    {stock.name}
                  </div>
                  <div className="text-2xs text-muted mt-0.5">{stock.symbol.replace('.NS', '')}</div>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-heading">
                      <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                    </span>
                    <span className={`text-2xs font-medium tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? '+' : ''}{formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Top Gainers & Top Losers (Side by Side) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gain" />
              Top gainers
            </h3>
            <span className="text-2xs text-muted">1D return</span>
          </div>
          <div className="divide-y divide-border">
            {topGainers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="flex items-center justify-between py-2.5 hover:bg-bg-subtle px-1 rounded cursor-pointer transition-colors duration-120"
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-heading truncate">{stock.name}</div>
                    <div className="text-2xs text-muted">{stock.symbol.replace('.NS', '')}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-heading">
                    <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                  </div>
                  <div className="text-2xs font-semibold text-gain tabular-nums">
                    +{formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-loss" />
              Top losers
            </h3>
            <span className="text-2xs text-muted">1D return</span>
          </div>
          <div className="divide-y divide-border">
            {topLosers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="flex items-center justify-between py-2.5 hover:bg-bg-subtle px-1 rounded cursor-pointer transition-colors duration-120"
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-heading truncate">{stock.name}</div>
                    <div className="text-2xs text-muted">{stock.symbol.replace('.NS', '')}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-heading">
                    <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                  </div>
                  <div className="text-2xs font-semibold text-loss tabular-nums">
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. All Stocks Table (Groww clean style, 56px rows, hover star, no buttons) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-heading">All stocks</h2>
            <span className="text-2xs text-muted">({filteredStocks.length})</span>
          </div>

          {/* Sector filter as single dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-2xs text-muted">Sector:</span>
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="bg-bg-card border border-border rounded-btn text-xs text-heading px-3 py-1.5 focus:outline-none focus:border-border-focus transition-colors"
            >
              {sectors.map(sec => (
                <option key={sec} value={sec}>
                  {sec === 'ALL' ? 'All sectors' : sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-subtle border-b border-border text-muted text-2xs font-medium">
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:text-heading select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Company</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('currentPrice')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-heading select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Market price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('changePercent')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-heading select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>1D change</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('volume')}
                    className="py-3 px-4 text-right hidden sm:table-cell cursor-pointer hover:text-heading select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Volume</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-xs text-muted">
                      No stocks found in sector "{selectedSector}".
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map(stock => {
                    const isPositive = stock.change >= 0;
                    const watchlisted = isWatchlisted(stock.symbol);

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        className="h-14 hover:bg-bg-subtle cursor-pointer transition-colors duration-120 group"
                      >
                        {/* Company Avatar + Name + Hover Star */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <CompanyAvatar symbol={stock.symbol} name={stock.name} size="sm" />
                            <div className="truncate">
                              <div className="font-semibold text-heading group-hover:text-primary transition-colors truncate">
                                {stock.name}
                              </div>
                              <div className="text-2xs text-muted">
                                {stock.symbol.replace('.NS', '')} · {stock.sector}
                              </div>
                            </div>

                            {/* Star on Hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(stock.symbol);
                              }}
                              className={`ml-1 p-1 rounded transition-opacity duration-120 ${
                                watchlisted
                                  ? 'opacity-100 text-amber-500'
                                  : 'opacity-0 group-hover:opacity-100 text-muted hover:text-amber-500'
                              }`}
                              aria-label={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                            >
                              <Star className={`w-3.5 h-3.5 ${watchlisted ? 'fill-amber-500' : ''}`} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>

                        {/* Market Price */}
                        <td className="py-2 px-4 text-right font-semibold text-heading tabular-nums">
                          <PriceText symbol={stock.symbol} price={stock.currentPrice} />
                        </td>

                        {/* 1D Change */}
                        <td className="py-2 px-4 text-right tabular-nums">
                          <span className={`font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
                            {isPositive ? '+' : ''}{formatINR(stock.change, true, 2)} ({formatPercent(stock.changePercent)})
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-2 px-4 text-right text-muted tabular-nums hidden sm:table-cell">
                          {formatNumber(stock.volume)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
