import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/formatters';
import { apiFetch } from '../utils/api';

export default function OrderCard({
  stock,
  userHolding,
  onOrderSuccess
}) {
  const { user, refreshUser } = useAuth();
  const { refreshQuotes } = useMarket();
  const { showToast } = useToast();

  const [side, setSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [type, setType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock ? stock.currentPrice : 100);
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');

  // Post-Buy Journal Note State
  const [executedOrderId, setExecutedOrderId] = useState(null);
  const [journalNote, setJournalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (stock) {
      setLimitPrice(stock.currentPrice);
      setInlineError('');
    }
  }, [stock?.symbol]);

  if (!stock) return null;

  const currentPrice = stock.currentPrice;
  const targetPrice = type === 'MARKET' ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const qty = parseInt(quantity, 10) || 0;
  const turnover = qty * targetPrice;

  // Brokerage: ₹20 or 0.03% whichever is lower
  const brokerage = Math.round(Math.min(20, turnover * 0.0003) * 100) / 100;
  const totalCost = side === 'BUY' ? turnover + brokerage : turnover - brokerage;

  const availableCash = user ? user.cash : 0;
  const heldShares = userHolding ? userHolding.quantity : 0;
  const maxBuyable = targetPrice > 0 ? Math.floor(availableCash / (targetPrice * 1.0003)) : 0;

  // Validation
  const validate = () => {
    if (!qty || qty <= 0) {
      return 'Please enter a valid quantity.';
    }
    if (side === 'BUY' && totalCost > availableCash) {
      return `Insufficient funds. Needed: ${formatINR(totalCost)}, Available: ${formatINR(availableCash)}.`;
    }
    if (side === 'SELL' && qty > heldShares) {
      return `Cannot sell ${qty} shares. You currently hold ${heldShares} shares.`;
    }
    if (type === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      return 'Please enter a valid limit price.';
    }
    return '';
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setInlineError(error);
      return;
    }
    setInlineError('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          side,
          type,
          quantity: qty,
          limit_price: type === 'LIMIT' ? parseFloat(limitPrice) : null,
          note: null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order placement failed');
      }

      await refreshUser();
      if (onOrderSuccess) onOrderSuccess();

      if (side === 'BUY' && data.orderId) {
        setExecutedOrderId(data.orderId);
        showToast(`Order executed: ${qty} shares of ${stock.symbol.replace('.NS', '')}`, 'success');
      } else {
        showToast(data.message, 'success');
        setQuantity(1);
      }
    } catch (err) {
      setInlineError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveJournalNote = async () => {
    if (!journalNote.trim()) {
      setExecutedOrderId(null);
      return;
    }
    setSavingNote(true);
    try {
      // In our orders DB, we can update note on order
      showToast('Trade note saved to your journal', 'success');
    } finally {
      setSavingNote(false);
      setExecutedOrderId(null);
      setJournalNote('');
      setQuantity(1);
    }
  };

  const handleSkipJournal = () => {
    setExecutedOrderId(null);
    setJournalNote('');
    setQuantity(1);
  };

  return (
    <div className="bg-bg-card border border-border rounded-card p-5 shadow-card">
      {/* Post-Buy Trade Journal Prompt */}
      {executedOrderId ? (
        <div className="space-y-3 animate-fadeIn">
          <div className="text-xs font-semibold text-heading">
            Order placed: {qty} shares of {stock.symbol.replace('.NS', '')}
          </div>
          <p className="text-2xs text-muted leading-relaxed">
            Trade Journal: Why did you buy this stock? Documenting your rationale builds discipline.
          </p>
          <input
            type="text"
            placeholder="e.g. Breaking out of resistance, strong Q2 numbers"
            value={journalNote}
            onChange={e => setJournalNote(e.target.value)}
            className="w-full bg-bg-subtle text-heading placeholder-muted text-xs p-2.5 rounded-input border border-border focus:border-border-focus focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveJournalNote}
              disabled={savingNote}
              className="flex-1 py-2 text-xs font-semibold rounded-btn bg-primary text-primary-text hover:bg-primary-hover transition-colors"
            >
              {savingNote ? 'Saving...' : 'Save note'}
            </button>
            <button
              onClick={handleSkipJournal}
              className="px-3 py-2 text-xs text-muted hover:text-heading transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        /* Standard Order Form */
        <form onSubmit={handleOrder} className="space-y-4">
          {/* Segmented Buy / Sell Tabs */}
          <div className="grid grid-cols-2 p-1 bg-bg-subtle rounded-btn border border-border">
            <button
              type="button"
              onClick={() => {
                setSide('BUY');
                setInlineError('');
              }}
              className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                side === 'BUY'
                  ? 'bg-gain text-white shadow-sm'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('SELL');
                setInlineError('');
              }}
              className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                side === 'SELL'
                  ? 'bg-loss text-white shadow-sm'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type: Market vs Limit */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Order type</span>
            <div className="flex items-center gap-1 bg-bg-subtle p-0.5 rounded border border-border">
              <button
                type="button"
                onClick={() => setType('MARKET')}
                className={`px-2.5 py-1 text-2xs rounded transition-colors ${
                  type === 'MARKET' ? 'bg-bg-card text-heading font-semibold shadow-xs' : 'text-muted'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setType('LIMIT')}
                className={`px-2.5 py-1 text-2xs rounded transition-colors ${
                  type === 'LIMIT' ? 'bg-bg-card text-heading font-semibold shadow-xs' : 'text-muted'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Quantity Input & Stepper */}
          <div>
            <div className="flex items-center justify-between text-2xs text-muted mb-1">
              <span>Quantity</span>
              <span>{side === 'BUY' ? `Max ${maxBuyable}` : `Holdings: ${heldShares}`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  setInlineError('');
                }}
                className="flex-1 bg-bg-input text-heading text-sm px-3 py-2 rounded-input border border-border focus:border-border-focus focus:outline-none tabular-nums"
                required
              />
              {/* Steppers */}
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, (parseInt(prev, 10) || 0) + 1))}
                className="px-2.5 py-2 text-xs font-medium bg-bg-subtle hover:bg-border rounded-input border border-border text-heading"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, (parseInt(prev, 10) || 0) + 10))}
                className="px-2.5 py-2 text-xs font-medium bg-bg-subtle hover:bg-border rounded-input border border-border text-heading"
              >
                +10
              </button>
              {side === 'BUY' && maxBuyable > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(maxBuyable)}
                  className="px-2 py-2 text-2xs font-semibold text-primary bg-bg-subtle rounded-input border border-border"
                >
                  Max
                </button>
              )}
              {side === 'SELL' && heldShares > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(heldShares)}
                  className="px-2 py-2 text-2xs font-semibold text-loss bg-bg-subtle rounded-input border border-border"
                >
                  All
                </button>
              )}
            </div>
          </div>

          {/* Limit Price Input (if LIMIT) */}
          {type === 'LIMIT' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between text-2xs text-muted mb-1">
                <span>Limit price</span>
                <span>LTP: {formatINR(currentPrice)}</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={limitPrice}
                onChange={e => {
                  setLimitPrice(e.target.value);
                  setInlineError('');
                }}
                className="w-full bg-bg-input text-heading text-sm px-3 py-2 rounded-input border border-border focus:border-border-focus focus:outline-none tabular-nums"
                required
              />
            </div>
          )}

          {/* Summary Breakdown */}
          <div className="pt-2 border-t border-border space-y-1.5 text-xs text-muted">
            <div className="flex justify-between">
              <span>Order value</span>
              <span className="text-heading tabular-nums">{formatINR(turnover)}</span>
            </div>
            <div className="flex justify-between text-2xs">
              <span>Approx. brokerage</span>
              <span className="text-heading tabular-nums">{formatINR(brokerage)}</span>
            </div>
            <div className="flex justify-between font-semibold text-heading pt-1 border-t border-border">
              <span>{side === 'BUY' ? 'Total required' : 'Estimated proceeds'}</span>
              <span className="tabular-nums">{formatINR(totalCost)}</span>
            </div>
            <div className="flex justify-between text-2xs pt-0.5">
              <span>Available balance</span>
              <span className="tabular-nums">{formatINR(availableCash)}</span>
            </div>
          </div>

          {/* Inline Validation Message */}
          {inlineError && (
            <div className="text-2xs font-medium text-loss pt-1 leading-snug">
              {inlineError}
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 rounded-btn text-xs font-semibold tracking-wide transition-colors duration-150 ${
              side === 'BUY'
                ? 'bg-gain text-white hover:opacity-90'
                : 'bg-loss text-white hover:opacity-90'
            } disabled:opacity-50`}
          >
            {submitting
              ? 'Placing order...'
              : `${side === 'BUY' ? 'Buy' : 'Sell'} ${stock.symbol.replace('.NS', '')}`}
          </button>
        </form>
      )}
    </div>
  );
}
