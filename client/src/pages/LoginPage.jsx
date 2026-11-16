import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      showToast('Welcome back to Dalal Dojo', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('demo');
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4 page-transition">
      <div className="w-full max-w-4xl bg-bg-card border border-border rounded-card shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Calm Value Proposition Panel */}
        <div className="p-8 sm:p-10 bg-bg-subtle border-b md:border-b-0 md:border-r border-border flex flex-col justify-between space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-[8px] bg-primary flex items-center justify-center text-primary-text font-bold">
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-heading">Dalal Dojo</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-heading leading-snug">
              Learn to invest with ₹10,00,000 of practice money
            </h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Experience the Indian stock market risk-free with live quotes and terminal-grade execution.
            </p>

            <ul className="mt-8 space-y-3.5 text-xs text-main">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Real-time market prices for 40+ top NSE blue-chips</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Realistic brokerage fees and automated limit orders</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Track your win rate and rationales in your trade journal</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border text-2xs text-muted">
            Simple, honest paper trading for beginners.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-heading">Log in</h1>
            <p className="text-xs text-muted mt-1">
              Enter your credentials or{' '}
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-primary hover:underline font-semibold"
              >
                try demo account
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-input bg-loss-subtle text-loss text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-2xs font-medium text-muted mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-bg-input text-heading text-xs px-3.5 py-2.5 rounded-input border border-border focus:border-border-focus focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-2xs font-medium text-muted">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-input text-heading text-xs pl-3.5 pr-10 py-2.5 rounded-input border border-border focus:border-border-focus focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted hover:text-heading"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-btn text-xs font-semibold bg-primary text-primary-text hover:bg-primary-hover transition-colors duration-150 disabled:opacity-50 mt-2"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
