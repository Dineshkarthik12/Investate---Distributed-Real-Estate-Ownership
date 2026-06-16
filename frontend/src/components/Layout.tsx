import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Home, List, MessageSquare, Bell, User as UserIcon, LogOut, TrendingUp } from 'lucide-react';
import api from '../api/client';

export const Layout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <span className="text-xl font-bold text-dark-900 hidden sm:block">LandConnect</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/listings" className="text-dark-700 hover:text-primary-600 font-medium transition-colors">Browse</Link>
                <Link to="/marketplace" className="text-dark-700 hover:text-primary-600 font-medium transition-colors">Marketplace</Link>
                <Link to="/how-it-works" className="text-dark-700 hover:text-primary-600 font-medium transition-colors">How it Works</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/chat" className="p-2 text-dark-600 hover:text-primary-600 transition-colors relative">
                    <MessageSquare size={20} />
                  </Link>
                  <Link to="/notifications" className="p-2 text-dark-600 hover:text-primary-600 transition-colors relative">
                    <Bell size={20} />
                  </Link>
                  <Link to="/dashboard" className="p-2 text-dark-600 hover:text-primary-600 transition-colors">
                    <UserIcon size={20} />
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-dark-600 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                  </button>
                  <div className="hidden sm:flex flex-col text-right ml-2">
                    <span className="text-sm font-semibold">{user?.full_name}</span>
                    <span className="text-xs text-primary-600 capitalize">{user?.role}</span>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-dark-700 hover:text-primary-600 font-medium hidden sm:block transition-colors">Log in</Link>
                  <Link to="/register" className="btn-primary">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-semibold text-dark-900">LandConnect © 2026</span>
          </div>
          <div className="flex space-x-6 text-sm text-dark-600">
            <Link to="/terms" className="hover:text-primary-600">Terms</Link>
            <Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-primary-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
