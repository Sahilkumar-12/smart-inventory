import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService } from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState({ expiry: [], expired: [], lowStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertData();
  }, []);

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll();
      const products = res.data;
      
      const today = new Date();
      const newAlerts = { expiry: [], expired: [], lowStock: [] };
      let toastExpiryCount = 0;
      let toastExpiredCount = 0;
      
      products.forEach(p => {
        // Low Stock
        if (p.quantity <= 5) {
          newAlerts.lowStock.push(p);
        }
        
        // Expiry Logic
        if (p.expiry_date) {
          const expDate = new Date(p.expiry_date);
          const diffTime = expDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            newAlerts.expired.push({ ...p, days: Math.abs(diffDays) });
            toastExpiredCount++;
          } else if (diffDays <= 7) {
            newAlerts.expiry.push({ ...p, days: diffDays });
            toastExpiryCount++;
          }
        }
      });
      
      if (toastExpiryCount > 0) toast.warning(`${toastExpiryCount} product(s) expiring soon!`);
      if (toastExpiredCount > 0) toast.error(`${toastExpiredCount} product(s) have expired!`);

      setAlerts(newAlerts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-transparent pb-6 mt-2">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-red-50 dark:bg-red-900/30 p-2.5 rounded-xl shadow-inner border border-red-200 dark:border-red-800">
               <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Alerts & Notifications
             </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
             Review critical stock warnings and expiration notices.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Near Expiry List */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center mb-4">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              Expiring Soon (Next 7 Days)
            </h3>
            {alerts.expiry.length === 0 ? (
              <p className="text-sm text-gray-500">No items expiring soon.</p>
            ) : (
              <ul className="space-y-3">
                {alerts.expiry.map(item => (
                  <li key={item._id} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800 flex justify-between">
                    <div>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-400">{item.name}</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">Stock: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
                      In {item.days} day(s)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Expired List */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Expired Products
            </h3>
            {alerts.expired.length === 0 ? (
               <p className="text-sm text-gray-500">No expired items.</p>
            ) : (
              <ul className="space-y-3">
                {alerts.expired.map(item => (
                  <li key={item._id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 flex justify-between">
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-400">{item.name}</p>
                      <p className="text-xs text-red-600 dark:text-red-500">Stock: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-red-700 dark:text-red-500">
                       {item.days === 0 ? "Today" : `${item.days} day(s) ago`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low Stock List */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center mb-4">
              <TrendingDown className="w-5 h-5 text-purple-500 mr-2" />
              Low Stock Warnings (5 or less)
            </h3>
            {alerts.lowStock.length === 0 ? (
               <p className="text-sm text-gray-500">Stock levels are healthy.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.lowStock.map(item => (
                  <div key={item._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                    </div>
                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-bold text-sm">
                      {item.quantity} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
