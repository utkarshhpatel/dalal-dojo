import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MarketPage from './pages/MarketPage';
import StockDetailPage from './pages/StockDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import OrdersPage from './pages/OrdersPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-xs text-muted">
        Loading Dalal Dojo...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-main flex flex-col font-sans transition-colors duration-160">
      <Navbar />

      {/* Main Content Area (1200px centered) */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
          <Route
            path="/portfolio"
            element={user ? <PortfolioPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/signup"
            element={!user ? <SignupPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
