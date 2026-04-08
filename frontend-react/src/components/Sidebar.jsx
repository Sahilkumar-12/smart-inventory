import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  BarChart2, 
  Settings,
  LogOut,
  Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Sales', path: '/sales', icon: ShoppingCart },
  { name: 'Scan & Sell', path: '/scanner', icon: Boxes },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Reports', path: '/reports', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col transition-colors duration-200 sticky top-0">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-dark-border">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl mr-3 shadow-lg shadow-primary-500/20">
          <Boxes className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          Smart Grocery<span className="text-primary-500">.</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/50 hover:text-gray-900 dark:hover:text-white'}
              `}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-2">
        <button 
          onClick={logout}
          className="flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
