import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { productService } from '../services/api';

const Topbar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Fetch every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await productService.getAll();
      const products = res.data || [];
      const today = new Date();
      const alerts = [];

      let expiredCount = 0;
      let expiringCount = 0;
      let lowStockCount = 0;

      products.forEach(p => {
        // Low Stock Alert
        if (p.quantity <= 5) {
          lowStockCount++;
        }

        // Expiry Alerts
        if (p.expiry_date) {
          const expDate = new Date(p.expiry_date);
          const diffTime = expDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            alerts.push({
              id: `expired-${p._id}`,
              type: 'expired',
              message: `${p.name} has expired`,
              product: p.name,
              severity: 'critical'
            });
            expiredCount++;
          } else if (diffDays <= 7) {
            alerts.push({
              id: `expiring-${p._id}`,
              type: 'expiring',
              message: `${p.name} expiring in ${diffDays} day(s)`,
              product: p.name,
              severity: 'warning',
              days: diffDays
            });
            expiringCount++;
          }
        }
      });

      setNotifications(alerts);
      setNotificationCount(expiredCount + expiringCount + lowStockCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-100 dark:border-dark-border sticky top-0 z-10 shadow-sm">
      {/* Title & Tagline (Desktop & Mobile) */}
      <div className="flex flex-col justify-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white lg:hidden">SGIS</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
          Manage stock, expiry, and sales efficiently
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-300"
          aria-label="Toggle dark mode"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border z-50">
              <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {notificationCount} alert{notificationCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-dark-border">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          notif.severity === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`font-semibold text-sm ${
                                notif.severity === 'critical'
                                  ? 'text-red-800 dark:text-red-200'
                                  : 'text-yellow-800 dark:text-yellow-200'
                              }`}
                            >
                              {notif.type === 'expired' ? '⚠️ Expired' : '🕐 Expiring Soon'}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {notif.message}
                            </p>
                            {notif.days && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notif.days} day{notif.days !== 1 ? 's' : ''} remaining
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-dark-border">
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  View All Alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name || 'User'}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border z-50">
              <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Account
                </p>
              </div>

              <div className="py-2 space-y-1">
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>
              </div>

              <div className="p-2 border-t border-gray-200 dark:border-dark-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
