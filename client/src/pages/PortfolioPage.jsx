import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import CompanyAvatar from '../components/CompanyAvatar';
import PriceText from '../components/PriceText';
import AllocationDonut from '../components/AllocationDonut';
import { formatINR, formatPercent } from '../utils/formatters';
import { apiFetch } from '../utils/api';

export default function PortfolioPage() {
  const { user } = useAuth();
  const { lastUpdated } = useMarket();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('current_value'); // 'current_value' | 'pnl' | 'name'

  const fetchPortfolio = async () => {
    try {
      const res = await apiFetch('/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (e) {
      console.error('Error fetching portfolio:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user, lastUpdated]);

  const summary = portfolio?.summary || {
    cash: user?.cash || 1000000,
    invested: 0,
    current_value: 0,
    net_worth: user?.cash || 1000000,
    total_pnl: 0,
    total_pnl_percent: 0,
    day_pnl: 0,
    total_return_percent: 0,
    has_concentration_risk: false,
    high_risk_symbol: null,
    high_risk_percent: 0,
  };

  const holdings = portfolio?.holdings || [];
  const allocation = portfolio?.allocation || [];

  // Sorted holdings list
  const sortedHoldings = useMemo(() => {
    const list = [...holdings];
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'pnl') return b.pnl - a.pnl;
      return b.current_value - a.current_value;
    });
    return list;
  }, [holdings, sortBy]);

  const isTotalGain = summary.total_pnl >= 0;
  const isDayGain = summary.day_pnl >= 0;

  return (
    <div className="space-y-6 page-transition pb-16">
      {/* 1. Top Summary Banner (Groww Holdings Style) */}
      <div className="bg-bg-card border border-border rounded-card p-6 shadow-card">
        <div className="text-2xs text-muted font-medium">Current portfolio value</div>
        <div className="text-2xl sm:text-3xl font-semibold text-heading tabular-nums mt-0.5">
          {formatINR(summary.current_value)}
        </div>

        {/* Total Returns */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted">Total returns:</span>
          <span className={`text-xs font-semibold tabular-nums ${isTotalGain ? 'text-gain' : 'text-loss'}`}>
            {isTotalGain ? '+' : ''}{formatINR(summary.total_pnl)} ({formatPercent(summary.total_pnl_percent)})
          </span>
        </div>

        {/* 3 Small Key Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border">
          <div>
            <div className="text-2xs text-muted">Total invested</div>
            <div className="text-sm font-semibold text-heading tabular-nums mt-0.5">
              {formatINR(summary.invested)}
            </div>
          </div>

          <div>
            <div className="text-2xs text-muted">1D returns</div>
            <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isDayGain ? 'text-gain' : 'text-loss'}`}>
              {isDayGain ? '+' : ''}{formatINR(summary.day_pnl)}
            </div>
          </div>

          <div>
            <div className="text-2xs text-muted">Available cash</div>
            <div className="text-sm font-semibold text-heading tabular-nums mt-0.5">
              {formatINR(summary.cash)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Left (Holdings) + Right (Allocation & Diversification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Holdings List (8 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-heading">Holdings</h2>
              <span className="text-2xs text-muted">({holdings.length})</span>
            </div>

            {/* Sort Dropdown */}
            {holdings.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-bg-card border border-border rounded-btn text-xs text-heading px-2.5 py-1 focus:outline-none focus:border-border-focus transition-colors"
                >
                  <option value="current_value">Current value</option>
                  <option value="pnl">Total P&L</option>
                  <option value="name">Company (A-Z)</option>
                </select>
              </div>
            )}
          </div>

          {/* Holdings Items or Minimalist Empty State */}
          {loading && holdings.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-card p-12 text-center text-xs text-muted">
              Loading your portfolio...
            </div>
          ) : holdings.length === 0 ? (
            /* Clean Minimal Line Illustration Empty State */
            <div className="bg-bg-card border border-border rounded-card p-12 text-center shadow-card space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-bg-subtle border border-border flex items-center justify-center text-muted">
                <Compass className="w-6 h-6 text-muted" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-heading">No holdings yet</h3>
              <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                You have ₹10,00,000 of virtual practice capital ready. Pick a stock from Explore to place your first trade.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-xs font-semibold rounded-btn bg-primary text-primary-text hover:bg-primary-hover transition-colors"
                >
                  Explore stocks
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-border rounded-card shadow-card divide-y divide-border overflow-hidden">
              {sortedHoldings.map(h => {
                const isHoldingGain = h.pnl >= 0;
                return (
                  <div
                    key={h.symbol}
                    onClick={() => navigate(`/stock/${h.symbol}`)}
                    className="flex items-center justify-between p-4 hover:bg-bg-subtle cursor-pointer transition-colors duration-120 group"
                  >
                    <div className="flex items-center gap-3 truncate pr-3">
                      <CompanyAvatar symbol={h.symbol} name={h.name} size="md" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-heading group-hover:text-primary transition-colors truncate">
                          {h.name}
                        </div>
                        <div className="text-2xs text-muted tabular-nums">
                          {h.quantity} shares · Avg {formatINR(h.avg_price)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-heading tabular-nums">
                        {formatINR(h.current_value)}
                      </div>
                      <div className={`text-2xs font-medium tabular-nums ${isHoldingGain ? 'text-gain' : 'text-loss'}`}>
                        {isHoldingGain ? '+' : ''}{formatINR(h.pnl)} ({formatPercent(h.pnl_percent)})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Allocation Donut & Risk Note (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-bg-card border border-border rounded-card p-5 shadow-card space-y-3">
            <h3 className="text-xs font-semibold text-heading">Asset allocation</h3>
            <AllocationDonut allocation={allocation} />
          </div>

          {/* Diversification Note (Soft Amber Box ONLY when > 40%) */}
          {summary.has_concentration_risk && (
            <div className="p-4 rounded-card bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="leading-relaxed">
                <span className="font-semibold block text-amber-900 dark:text-amber-100">
                  Diversification note
                </span>
                Your position in <strong>{summary.high_risk_symbol?.replace('.NS', '')}</strong> accounts for <strong>{summary.high_risk_percent}%</strong> of your net worth (above the 40% prudence guideline). Spreading capital across sectors reduces downside risk.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
