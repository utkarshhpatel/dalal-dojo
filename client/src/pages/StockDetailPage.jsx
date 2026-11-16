import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Briefcase, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import CompanyAvatar from '../components/CompanyAvatar';
import PriceText from '../components/PriceText';
import StockChart from '../components/StockChart';
import OrderCard from '../components/OrderCard';
import { formatINR, formatPercent, formatNumber, formatTime } from '../utils/formatters';
import { apiFetch } from '../utils/api';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quotes, isWatchlisted, toggleWatchlist } = useMarket();

  const [stock, setStock] = useState(null);
  const [userHolding, setUserHolding] = useState(null);
  const [mobileOrderSheetOpen, setMobileOrderSheetOpen] = useState(false);

  // Find stock in live quotes
  useEffect(() => {
    if (!symbol) return;
    const found = quotes.find(q => q.symbol.toUpperCase() === symbol.toUpperCase());
    if (found) {
      setStock(found);
    }
  }, [symbol, quotes]);

  // Fetch holding status for this user & symbol
  const fetchHolding = async () => {
    if (!user || !symbol) return;
    try {
      const res = await apiFetch('/portfolio');
      if (res.ok) {
        const data = await res.json();
        const holding = data.holdings.find(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        setUserHolding(holding || null);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchHolding();
  }, [user, symbol]);

  if (!stock) {
    return (
      <div className="py-20 text-center text-xs text-muted">
        Loading stock details for {symbol}...
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const watchlisted = isWatchlisted(stock.symbol);

  // Day Range position calculation
  const dayRangeSpan = stock.dayHigh - stock.dayLow;
  const dayPosition = dayRangeSpan > 0
    ? Math.min(100, Math.max(0, ((stock.currentPrice - stock.dayLow) / dayRangeSpan) * 100))
    : 50;

  // 52-Week Estimated Range
  const est52Low = stock.dayLow * 0.82;
  const est52High = stock.dayHigh * 1.28;
  const span52 = est52High - est52Low;
  const pos52 = span52 > 0
    ? Math.min(100, Math.max(0, ((stock.currentPrice - est52Low) / span52) * 100))
    : 50;

  return (
    <div className="space-y-6 page-transition pb-20 lg:pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-heading transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Back to Explore</span>
        </button>
      </div>

      {/* Two Column Layout: Left 68% / Right 32% (Sticky on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Main) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CompanyAvatar symbol={stock.symbol} name={stock.name} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-semibold text-heading">
                    {stock.name}
                  </h1>
                  <button
                    onClick={() => toggleWatchlist(stock.symbol)}
                    className="p-1 text-muted hover:text-amber-500 transition-colors"
                    title={watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                    aria-label="Toggle Watchlist"
                  >
                    <Star
                      className={`w-4 h-4 ${watchlisted ? 'fill-amber-500 text-amber-500' : ''}`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
                <div className="text-xs text-muted">
                  {stock.symbol.replace('.NS', '')} · NSE · {stock.sector}
                </div>
              </div>
            </div>

            {/* Price & Change */}
            <div className="text-right">
              <div className="text-2xl sm:text-xl font-semibold text-heading tabular-nums">
                <PriceText symbol={stock.symbol} price={stock.currentPrice} />
              </div>
              <div className={`text-xs font-medium tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
                {isPositive ? '+' : ''}{formatINR(stock.change, true, 2)} ({formatPercent(stock.changePercent)})
              </div>
              <div className="text-2xs text-subtle mt-0.5">
                As of {formatTime(stock.lastUpdated)}
              </div>
            </div>
          </div>

          {/* Large TradingView Chart */}
          <StockChart symbol={stock.symbol} currentPrice={stock.currentPrice} />

          {/* Your Position Card (Only if held) */}
          {userHolding && (
            <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <Briefcase className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-xs font-semibold text-heading">Your position</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <span className="text-2xs text-muted block">Shares held</span>
                  <span className="text-heading tabular-nums font-semibold">{userHolding.quantity}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block">Average buy price</span>
                  <span className="text-heading tabular-nums font-semibold">{formatINR(userHolding.avg_price)}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block">Current valuation</span>
                  <span className="text-heading tabular-nums font-semibold">{formatINR(userHolding.current_value)}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block">Unrealized P&L</span>
                  <span className={`tabular-nums font-semibold ${userHolding.pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {userHolding.pnl >= 0 ? '+' : ''}{formatINR(userHolding.pnl)} ({formatPercent(userHolding.pnl_percent)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Performance (Day Low/High and 52-Week Bars) */}
          <div className="bg-bg-card border border-border rounded-card p-5 shadow-card space-y-5">
            <h3 className="text-xs font-semibold text-heading">Performance</h3>

            {/* Day Range Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-2xs text-muted">
                <span>Today's low</span>
                <span className="font-medium text-heading">Day range</span>
                <span>Today's high</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-heading tabular-nums">
                <span>{formatINR(stock.dayLow)}</span>
                <span>{formatINR(stock.dayHigh)}</span>
              </div>
              <div className="relative w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden border border-border">
                <div
                  className="absolute top-0 bottom-0 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${dayPosition}%` }}
                />
              </div>
            </div>

            {/* 52-Week Range Bar */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-2xs text-muted">
                <span>52W low (est.)</span>
                <span className="font-medium text-heading">52-Week range</span>
                <span>52W high (est.)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-heading tabular-nums">
                <span>{formatINR(est52Low)}</span>
                <span>{formatINR(est52High)}</span>
              </div>
              <div className="relative w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden border border-border">
                <div
                  className="absolute top-0 bottom-0 bg-muted rounded-full transition-all duration-300"
                  style={{ width: `${pos52}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fundamentals (2-Column Key-Value List) */}
          <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
            <h3 className="text-xs font-semibold text-heading mb-4">Fundamentals</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Open price</span>
                <span className="text-heading font-medium tabular-nums">{formatINR(stock.open)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Previous close</span>
                <span className="text-heading font-medium tabular-nums">{formatINR(stock.previousClose)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Day volume</span>
                <span className="text-heading font-medium tabular-nums">{formatNumber(stock.volume)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Day turnover (est.)</span>
                <span className="text-heading font-medium tabular-nums">{formatINR(stock.volume * stock.currentPrice)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Exchange</span>
                <span className="text-heading font-medium">National Stock Exchange (NSE)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted">Trading currency</span>
                <span className="text-heading font-medium">Indian Rupee (INR)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Order Card (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <OrderCard
            stock={stock}
            userHolding={userHolding}
            onOrderSuccess={fetchHolding}
          />
        </div>
      </div>

      {/* Mobile Sticky Buy/Sell Bar at Bottom */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-bg-card border-t border-border flex items-center gap-3">
        <button
          onClick={() => setMobileOrderSheetOpen(true)}
          className="flex-1 py-2.5 rounded-btn text-xs font-semibold bg-gain text-white shadow-sm"
        >
          Buy {stock.symbol.replace('.NS', '')}
        </button>
        <button
          onClick={() => setMobileOrderSheetOpen(true)}
          className="flex-1 py-2.5 rounded-btn text-xs font-semibold bg-loss text-white shadow-sm"
        >
          Sell
        </button>
      </div>

      {/* Mobile Order Card Bottom Sheet */}
      {mobileOrderSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setMobileOrderSheetOpen(false)}
          />
          <div className="relative bg-bg-card rounded-t-card border-t border-border p-4 shadow-xl z-10 max-h-[85vh] overflow-y-auto animate-slideInUp">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <span className="text-xs font-semibold text-heading">Place paper order</span>
              <button
                onClick={() => setMobileOrderSheetOpen(false)}
                className="p-1 text-muted hover:text-heading"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <OrderCard
              stock={stock}
              userHolding={userHolding}
              onOrderSuccess={() => {
                fetchHolding();
                setMobileOrderSheetOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
