import React, { useState, useEffect } from 'react';
import { FileText, Download, BarChart2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { reportService } from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getAll();
      setReports(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await reportService.generate();
      toast.success('Report generated successfully!');
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCSV = (report) => {
    try {
      // Prepare CSV content with headers and data
      const csvContent = [
        ['Smart Grocery Inventory System - Daily Report'],
        [`Report Date: ${report.date}`],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        ['Metric', 'Value'],
        ['Total Investment', `₹${report.total_investment?.toFixed(2) || 0}`],
        ['Remaining Value', `₹${report.remaining_value?.toFixed(2) || 0}`],
        ['Total Revenue', `₹${report.total_revenue?.toFixed(2) || 0}`],
        ['Expiry Loss', `₹${report.expiry_loss?.toFixed(2) || 0}`],
        ['Net Profit', `₹${report.net_profit?.toFixed(2) || 0}`],
        [],
        ['Inventory Summary'],
        ['Total Products', report.total_products || 0],
        ['Expired Items', report.expired_count || 0],
        ['Near Expiry Items', report.near_expiry_count || 0],
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
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SGIS_Report_${report.date || new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/50 dark:bg-dark-card/50 backdrop-blur pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 flex items-center">
             <BarChart2 className="w-8 h-8 mr-3 text-primary-500" />
             Analytics & Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and download daily inventory and sales summaries.
          </p>
        </div>
        <button 
          onClick={handleGenerateReport} 
          disabled={generating}
          className="btn-primary flex items-center whitespace-nowrap"
        >
          {generating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          Generate Today's Report
        </button>
      </div>

      <div className="glass-card p-6 min-h-[500px] flex flex-col">
        {loading ? (
             <div className="flex flex-1 items-center justify-center">
               <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : reports.length === 0 ? (
            <div className="flex flex-col flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-lg">No reports generated yet.</p>
              <p className="text-sm mt-1">Click the "Generate Today's Report" button to create one.</p>
            </div>
        ) : (
          <div className="overflow-x-auto flex-1">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
               <thead className="bg-gray-50 dark:bg-gray-800/50">
                 <tr>
                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit</th>
                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</th>
                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining Value</th>
                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loss (Expiry)</th>
                   <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {reports.map((r) => (
                   <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                       {r.date}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                       ₹{r.net_profit.toFixed(2)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                       ₹{r.total_revenue.toFixed(2)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                       ₹{r.remaining_value.toFixed(2)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                       ₹{r.expiry_loss.toFixed(2)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDownloadCSV(r)} 
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors inline-flex items-center"
                          title="Download CSV"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
