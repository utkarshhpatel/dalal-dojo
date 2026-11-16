import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { formatINR, formatPercent } from '../utils/formatters';
import { apiFetch } from '../utils/api';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { lastUpdated } = useMarket();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiFetch('/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user, lastUpdated]);

  const top3 = useMemo(() => {
    if (leaderboard.length < 3) return leaderboard;
    // Arrangement: Rank 2 on left, Rank 1 in center (raised), Rank 3 on right
    return [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean);
  }, [leaderboard]);

  const restRanked = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  // Check if current user is outside top 20
  const currentUserInTop20 = leaderboard.some(u => user && u.username === user.username);

  return (
    <div className="space-y-8 page-transition pb-16">
      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-heading">Trader leaderboard</h1>
        <p className="text-xs text-muted mt-0.5">
          Rankings calculated on total portfolio return against the ₹10,00,000 starting capital.
        </p>
      </div>

      {/* Top 3 Podium Cards (No medal emojis! 1st slightly raised in center) */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-4">
          {top3.map((trader) => {
            const isFirst = trader.rank === 1;
            const isUser = user && user.username === trader.username;
            const isPositive = trader.returnPercent >= 0;

            return (
              <div
                key={trader.id}
                className={`bg-bg-card border rounded-card p-5 shadow-card text-center transition-all duration-150 ${
                  isFirst
                    ? 'border-primary sm:-translate-y-2 order-1 sm:order-2 shadow-md'
                    : trader.rank === 2
                    ? 'border-border order-2 sm:order-1'
                    : 'border-border order-3'
                } ${isUser ? 'bg-primary/5' : ''}`}
              >
                {/* Clean Rank Number Indicator */}
                <div className="inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-semibold mb-2 bg-bg-subtle text-heading border border-border">
                  {trader.rank}
                </div>

                <div className="w-12 h-12 mx-auto rounded-full bg-bg-subtle border border-border flex items-center justify-center text-sm font-semibold text-heading mb-2">
                  {trader.username.charAt(0).toUpperCase()}
                </div>

                <div className="text-sm font-semibold text-heading flex items-center justify-center gap-1.5 truncate">
                  <span>{trader.username}</span>
                  {isUser && (
                    <span className="text-2xs font-medium px-1.5 py-0.2 rounded bg-primary/20 text-heading">
                      You
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted mt-0.5 tabular-nums">
                  {formatINR(trader.netWorth)}
                </div>

                <div className={`text-sm font-semibold tabular-nums mt-2 ${isPositive ? 'text-gain' : 'text-loss'}`}>
                  {isPositive ? '+' : ''}{formatPercent(trader.returnPercent)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranked Table */}
      <div className="bg-bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle border-b border-border text-muted text-2xs font-medium">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Trader</th>
                <th className="py-3 px-4 text-right">Portfolio value</th>
                <th className="py-3 px-4 text-right">Total return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-xs text-muted">
                    Loading leaderboard standings...
                  </td>
                </tr>
              ) : (
                leaderboard.map(item => {
                  const isCurrent = user && (user.username === item.username || item.isCurrentUser);
                  const isPositive = item.returnPercent >= 0;

                  return (
                    <tr
                      key={item.id}
                      className={`h-12 transition-colors ${
                        isCurrent
                          ? 'bg-primary/10 font-medium'
                          : 'hover:bg-bg-subtle'
                      }`}
                    >
                      <td className="py-2 px-4 text-center text-muted font-medium tabular-nums">
                        {item.rank}
                      </td>

                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-bg-subtle border border-border flex items-center justify-center text-2xs font-semibold text-heading shrink-0">
                            {item.username.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-semibold ${isCurrent ? 'text-heading' : 'text-heading'}`}>
                            {item.username}
                          </span>
                          {isCurrent && (
                            <span className="text-2xs font-semibold px-1.5 py-0.2 rounded bg-primary text-primary-text">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-4 text-right tabular-nums text-heading font-medium">
                        {formatINR(item.netWorth)}
                      </td>

                      <td className="py-2 px-4 text-right tabular-nums">
                        <span className={`font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                          {isPositive ? '+' : ''}{formatPercent(item.returnPercent)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned User Row (if user is logged in and outside top 20) */}
        {user && !currentUserInTop20 && (
          <div className="p-3 bg-bg-subtle border-t-2 border-border flex items-center justify-between text-xs">
            <span className="text-muted">Your current rank: <strong>#28</strong></span>
            <span className="font-semibold text-heading tabular-nums">
              {formatINR(user.cash)} (0.00%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
