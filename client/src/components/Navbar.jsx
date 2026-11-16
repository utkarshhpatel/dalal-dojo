import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Briefcase, 
  Clock, 
  Trophy, 
  User, 
  Sun, 
  Moon, 
  Star, 
  RotateCcw, 
  LogOut, 
  TrendingUp,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import SearchBox from './SearchBox';
import WatchlistDrawer from './WatchlistDrawer';
import { formatINR } from '../utils/formatters';

export default function Navbar() {
  const { user, logout, resetAccount } = useAuth();
  const { isSimulated, watchlistSymbols } = useMarket();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [watchlistDrawerOpen, setWatchlistDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAccount();
      setShowResetConfirm(false);
      setProfileOpen(false);
      showToast('Account reset successfully. Restored ₹10,00,000.', 'success');
      window.location.reload();
    } catch (err) {
      showToast('Failed to reset account: ' + err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const navLinks = [
    { name: 'Explore', path: '/' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Orders', path: '/orders' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  const userInitial = user ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-card border-b border-border transition-colors duration-160">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Left: Simple Wordmark + Logo Mark */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-primary-text font-bold transition-transform group-hover:scale-105">
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold text-heading tracking-tight">
              Dalal Dojo
            </span>
          </NavLink>

          {/* Center: Wide Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <SearchBox className="w-full" />
          </div>

          {/* Right: Navigation Links, Star Drawer, Theme Toggle, Profile Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 mr-1">
              {navLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs font-medium rounded-btn transition-colors duration-120 ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-muted hover:text-heading hover:bg-bg-subtle'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-muted hover:text-heading rounded-btn hover:bg-bg-subtle transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Watchlist Star Icon Drawer Trigger */}
            <button
              onClick={() => setWatchlistDrawerOpen(true)}
              className="relative p-2 text-muted hover:text-heading rounded-btn hover:bg-bg-subtle transition-colors"
              title="Open Watchlist"
              aria-label="Open Watchlist"
            >
              <Star className="w-4 h-4" strokeWidth={1.5} />
              {watchlistSymbols.size > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-heading rounded-btn hover:bg-bg-subtle transition-colors"
              title={isDark ? 'Switch to Light (Groww)' : 'Switch to Dark (Binance)'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>

            {/* User Profile Avatar / Auth CTAs */}
            {user ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full bg-bg-subtle border border-border flex items-center justify-center font-semibold text-xs text-heading hover:border-primary transition-colors ml-1"
                  aria-label="User profile menu"
                >
                  {userInitial}
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-border rounded-card shadow-card py-2 z-50 text-xs animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-border">
                      <div className="font-semibold text-heading truncate">{user.username}</div>
                      <div className="text-2xs text-muted mt-0.5 font-medium tabular-nums">
                        Cash: {formatINR(user.cash)}
                      </div>
                    </div>

                    {/* Small Honest Simulated / Live Market Indicator */}
                    <div className="px-3.5 py-2 border-b border-border flex items-center gap-1.5 text-2xs text-muted">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? 'bg-amber-400' : 'bg-gain'}`} />
                      <span>{isSimulated ? 'Simulated prices' : 'Live prices'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowResetConfirm(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-muted hover:text-heading hover:bg-bg-subtle flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
                      <span>Reset account</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-loss hover:bg-bg-subtle flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <NavLink
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-main hover:text-heading transition-colors"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-primary text-primary-text hover:bg-primary-hover transition-colors"
                >
                  Sign up
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-border pt-2 bg-bg-card">
            <SearchBox className="w-full" />
          </div>
        )}
      </header>

      {/* Slide-over Watchlist Drawer */}
      <WatchlistDrawer
        isOpen={watchlistDrawerOpen}
        onClose={() => setWatchlistDrawerOpen(false)}
      />

      {/* Account Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-sm bg-bg-card border border-border rounded-card p-5 shadow-card animate-fadeIn">
            <div className="flex items-center gap-2 text-heading mb-2">
              <RotateCcw className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold">Reset paper trading account?</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-5">
              This will clear all your active holdings, pending orders, and trade history. Your virtual cash will be restored to <strong>₹10,00,000.00</strong>.
            </p>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-btn text-muted hover:text-heading hover:bg-bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="px-3.5 py-1.5 rounded-btn font-semibold bg-loss text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Tab Bar (Like Groww App) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border h-14 flex items-center justify-around px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted'
            }`
          }
        >
          <Compass className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Explore</span>
        </NavLink>

        <NavLink
          to="/portfolio"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted'
            }`
          }
        >
          <Briefcase className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Portfolio</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted'
            }`
          }
        >
          <Clock className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted'
            }`
          }
        >
          <Trophy className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Leaderboard</span>
        </NavLink>

        <button
          onClick={() => (user ? setProfileOpen(true) : navigate('/login'))}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs text-muted"
        >
          <User className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>{user ? 'Account' : 'Log in'}</span>
        </button>
      </div>
    </>
  );
}
