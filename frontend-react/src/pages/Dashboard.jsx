import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { productService, reportService, dashboardService } from '../services/api';
import { toast } from 'react-toastify';
import { Boxes } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass, textClass }) => (
  <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 border-t-4 border-transparent hover:border-primary-500 relative overflow-hidden">
    <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
       <Icon className="w-32 h-32" />
    </div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl flex items-center justify-center ${bgClass} shadow-md`}>
        <Icon className={`w-7 h-7 ${textClass}`} strokeWidth={2.5} />
      </div>
    </div>
    <div className="mt-5 flex items-center relative z-10 bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-lg w-fit">
      <span className={`flex items-center text-sm font-bold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" strokeWidth={3} /> : <ArrowDownRight className="w-4 h-4 mr-1" strokeWidth={3} />}
        {trendValue}
      </span>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    investment: '₹0',
    remaining: '₹0',
    revenue: '₹0',
    loss: '₹0'
  });
  
  // Simulated data for charts
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 3000, 5000, 4200, 6000, 7200],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const lossData = {
    labels: ['Expired', 'Damaged', 'Lost', 'Other'],
    datasets: [
      {
        data: [300, 50, 100, 40],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(156, 163, 175, 1)' // Gray-400
        }
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(156, 163, 175, 0.2)' } }
    }
  };

  const [alertItems, setAlertItems] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const downloadCSV = async () => {
    try {
      setDownloading(true);
      const res = await productService.getAll();
      const products = res.data || [];

      if (products.length === 0) {
        toast.warning('No products available to download');
        return;
      }

      // Prepare CSV header
      const headers = ['Product Name', 'Category', 'Quantity', 'Cost Price (₹)', 'Retail Price (₹)', 'Expiry Date', 'Status'];
      
      // Prepare CSV rows
      const rows = products.map(p => [
        p.name || '',
        p.category || '',
        p.quantity || 0,
        p.cost_price || 0,
        p.retail_price || 0,
        p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : 'N/A',
        p.status || 'UNKNOWN'
      ]);

      // Create CSV content
      const csvContent = [
        ['Smart Grocery Inventory System - Product Report'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        headers,
        ...rows
      ]
        .map(row => row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const str = String(cell);
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `SGIS_Products_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  const exportReport = async () => {
    try {
      setDownloading(true);
      const res = await reportService.getAll();
      const reports = res.data || [];

      if (reports.length === 0) {
        toast.warning('No reports available to download');
        return;
      }

      // Get the latest report
      const latestReport = reports[reports.length - 1];

      // Prepare CSV content
      const reportData = [
        ['Smart Grocery Inventory System - Financial Report'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        ['Report Date', latestReport.date || 'N/A'],
        ['Total Investment', latestReport.total_investment || 0],
        ['Remaining Value', latestReport.remaining_value || 0],
        ['Total Revenue', latestReport.total_revenue || 0],
        ['Expiry Loss', latestReport.expiry_loss || 0],
        ['Net Profit', latestReport.net_profit || 0],
        [],
        ['Total Products', latestReport.total_products || 0],
        ['Expired Count', latestReport.expired_count || 0],
        ['Near Expiry Count', latestReport.near_expiry_count || 0],
      ]
        .map(row => row.map(cell => {
          const str = String(cell);
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([reportData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `SGIS_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await dashboardService.getStats();
        const data = res.data;
        // If no data (all zeros), use default values for new users
        if (data.total_investment === 0 && data.remaining_value === 0 && data.total_revenue === 0 && data.expiry_loss === 0) {
          setStats({
            investment: '₹24,000',
            remaining: '₹15,500',
            revenue: '₹12,400',
            loss: '₹0'
          });
        } else {
          setStats({
            investment: `₹${data.total_investment.toLocaleString()}`,
            remaining: `₹${data.remaining_value.toLocaleString()}`,
            revenue: `₹${data.total_revenue.toLocaleString()}`,
            loss: `₹${data.expiry_loss.toLocaleString()}`
          });
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to defaults
        setStats({
          investment: '₹24,000',
          remaining: '₹15,500',
          revenue: '₹12,400',
          loss: '₹0'
        });
      }
    };
    
    loadStats();
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await productService.getAll();
        const products = res.data;
        const today = new Date();
        const detectedAlerts = [];
        
        products.forEach(p => {
          let hasAlert = false;
          if (p.expiry_date) {
            const expDate = new Date(p.expiry_date);
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) {
              detectedAlerts.push({ ...p, type: 'expired', diffDays });
              toast.error(`Product expired: ${p.name}`);
              hasAlert = true;
            } else if (diffDays <= 7) {
              detectedAlerts.push({ ...p, type: 'expiring_soon', diffDays });
              toast.warning(`Product expiring soon: ${p.name}`);
              hasAlert = true;
            }
          }
          if (p.quantity <= 5 && !hasAlert) {
             detectedAlerts.push({ ...p, type: 'low_stock' });
          }
        });

        // Sort by priority: expired -> low_stock -> expiring_soon
        detectedAlerts.sort((a, b) => {
          const priority = { expired: 1, low_stock: 2, expiring_soon: 3 };
          return priority[a.type] - priority[b.type];
        });

        setAlertItems(detectedAlerts);
        
      } catch (err) {
        console.error("Failed to load dashboard product alerts", err);
      }
    };
    
    loadAlerts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent pb-6 mt-2">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl shadow-inner border border-primary-200 dark:border-primary-800">
               <Boxes className="w-6 h-6 text-primary-600 dark:text-primary-400" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Dashboard Overview
             </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
             Manage stock, expiry, and sales efficiently inside Smart Grocery Inventory System.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <button 
            onClick={() => navigate('/scanner')}
            className="btn-secondary shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Scan & Sell
          </button>
          <button 
            onClick={downloadCSV}
            disabled={downloading}
            className="btn-secondary shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download CSV'}
          </button>
          <button 
            onClick={exportReport}
            disabled={downloading}
            className="btn-primary shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Investment" 
          value={stats.investment} 
          icon={DollarSign} 
          trend="up" 
          trendValue="12.5%" 
          bgClass="bg-blue-500/20"
          textClass="text-blue-500"
        />
        <StatCard 
          title="Remaining Value" 
          value={stats.remaining} 
          icon={ShoppingBag} 
          trend="down" 
          trendValue="4.2%" 
          bgClass="bg-purple-500/20"
          textClass="text-purple-500"
        />
        <StatCard 
          title="Total Revenue" 
          value={stats.revenue} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="18.2%" 
          bgClass="bg-green-500/20"
          textClass="text-green-500"
        />
        <StatCard 
          title="Total Loss" 
          value={stats.loss} 
          icon={TrendingDown} 
          trend="down" 
          trendValue="2.1%" 
          bgClass="bg-red-500/20"
          textClass="text-red-500"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Revenue Flow</h3>
          <div className="flex-1 min-h-[300px]">
             <Line options={chartOptions} data={revenueData} />
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Loss Breakdown</h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
             <Doughnut data={lossData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(156, 163, 175, 1)'} } } }} />
          </div>
        </div>
      </div>

      {/* Recent Alerts (Preview) */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Near Expiry & Alerts (7 Days)</h3>
        <div className="overflow-x-auto">
          {alertItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center pb-2">No critical alerts or expiring items at this time.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {alertItems.slice(0, 5).map(item => (
                  <tr key={`${item._id}-${item.type}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs border border-gray-200 dark:border-gray-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                       <span className={item.quantity <= 5 ? 'text-red-600 font-bold' : ''}>{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                       {item.type === 'low_stock' ? 'Needs Restock' : item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'expired' && (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                          Expired
                        </span>
                      )}
                      {item.type === 'expiring_soon' && (
                         <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                           Expiring Soon
                         </span>
                      )}
                      {item.type === 'low_stock' && (
                         <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                           Low Stock
                         </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
