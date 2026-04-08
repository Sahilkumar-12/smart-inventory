import React, { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCcw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService, salesService } from '../services/api';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sale Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, salesRes] = await Promise.all([
        productService.getAll(),
        salesService.getHistory()
      ]);
      // Only keep products with stock
      setProducts(productsRes.data.filter(p => p.quantity > 0));
      setSalesHistory(salesRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedProductId || quantityToSell < 1) {
      toast.error("Please select a valid product and quantity.");
      return;
    }

    setFormLoading(true);
    try {
      await salesService.recordSale({
        product_id: selectedProductId,
        quantity_sold: parseInt(quantityToSell, 10)
      });
      toast.success('Sale recorded successfully!');
      
      // Reset form
      setSelectedProductId('');
      setQuantityToSell(1);
      
      // Refresh data to show new stock + history
      fetchData();
    } catch (error) {
       toast.error(error.response?.data?.detail || 'Error processing sale.');
    } finally {
      setFormLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent pb-6 mt-2 gap-4">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl shadow-inner border border-primary-200 dark:border-primary-800">
               <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Sales & Billing
             </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
             Process new sales and manage transaction history.
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center shadow-sm hover:shadow-md transition-shadow">
          <RefreshCcw className="w-5 h-5 mr-2 text-gray-500" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Point of Sale Box */}
        <div className="glass-card p-6 flex flex-col lg:col-span-1">
          <div className="flex items-center mb-6 text-primary-600 dark:text-primary-400">
            <ShoppingCart className="w-6 h-6 mr-2" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Record Sale</h3>
          </div>
          
          <form onSubmit={handleSale} className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
              <select 
                value={selectedProductId} 
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input-field cursor-pointer"
                required
              >
                <option value="" disabled>-- Available Stock --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.quantity} in stock)
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProduct && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
                <div className="text-sm flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Retail Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₹{selectedProduct.retail_price}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input 
                type="number"
                min="1"
                max={selectedProduct?.quantity || 1}
                value={quantityToSell}
                onChange={(e) => setQuantityToSell(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {selectedProduct && quantityToSell > 0 && (
               <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                 <div className="flex justify-between items-end">
                   <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                   <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                     ₹{(selectedProduct.retail_price * quantityToSell).toFixed(2)}
                   </span>
                 </div>
               </div>
            )}
            
            <button 
              type="submit" 
              disabled={formLoading || !selectedProductId}
              className="mt-6 w-full btn-primary flex items-center justify-center p-3 text-lg"
            >
              {formLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Complete Sale
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sales History Table */}
        <div className="glass-card p-6 flex flex-col lg:col-span-2">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h3>
           <div className="flex-1 overflow-x-auto">
             {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
             ) : salesHistory.length === 0 ? (
                <div className="flex flex-col h-64 items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No sales recorded yet.</p>
                </div>
             ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {salesHistory.map((sale) => (
                      <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(sale.sale_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {sale.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {sale.quantity_sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          ₹{sale.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Sales;
