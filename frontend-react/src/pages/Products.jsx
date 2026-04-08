import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  X,
  Package,
  QrCode
} from 'lucide-react';
import ReactQRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { productService } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    cost_price: '',
    retail_price: '',
    expiry_date: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrProduct, setSelectedQrProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getAll();
      setProducts(res.data || []);
      console.log('Products loaded:', res.data);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load products');
      toast.error('Failed to load products: ' + (error.response?.data?.detail || error.message));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setIsEditMode(true);
      setCurrentId(product._id);
      setFormData({
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        cost_price: product.cost_price,
        retail_price: product.retail_price,
        // Optional: depending on format, handle date string properly
        expiry_date: product.expiry_date.split('T')[0]
      });
    } else {
      setIsEditMode(false);
      setCurrentId(null);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        cost_price: '',
        retail_price: '',
        expiry_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditMode) {
        await productService.update(currentId, formData);
        toast.success('Product updated successfully!');
      } else {
        await productService.create(formData);
        toast.success('Product added successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'An error occurred while saving the product.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete product');
      }
    }
  };

  const openQrModal = (product) => {
    setSelectedQrProduct(product);
    setQrModalOpen(true);
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
    setSelectedQrProduct(null);
  };

  const copyQrCode = async () => {
    if (!selectedQrProduct?.qr_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedQrProduct.qr_code);
      toast.success('QR code copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy QR code');
    }
  };

  const filteredProducts = searchTerm.trim() === '' 
    ? products 
    : products.filter(p => {
        const searchLower = searchTerm.toLowerCase().trim();
        return (
          (p.name && p.name.toLowerCase().includes(searchLower)) ||
          (p.category && p.category.toLowerCase().includes(searchLower)) ||
          (p.cost_price && p.cost_price.toString().includes(searchLower)) ||
          (p.retail_price && p.retail_price.toString().includes(searchLower)) ||
          (p.quantity && p.quantity.toString().includes(searchLower)) ||
          (p.status && p.status.toLowerCase().includes(searchLower))
        );
      });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (products.length === 0 && value.trim() !== '') {
      console.warn('No products loaded yet. Please wait for products to load.');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent pb-6 mt-2 gap-4">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl shadow-inner border border-primary-200 dark:border-primary-800">
               <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Products Management
             </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
             View, add, edit, and remove stock inside Smart Grocery Inventory System.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center whitespace-nowrap shadow-lg shadow-primary-500/20">
          <Plus className="w-5 h-5 mr-2" strokeWidth={2.5} />
          Add Product
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-card flex flex-col min-h-[500px]">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex flex-col gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                 <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Search by name, category, price, qty, status..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus={false}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg whitespace-nowrap">
                Found: <span className="font-bold text-primary-600 dark:text-primary-400">{filteredProducts.length}</span> / {products.length}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          {error && (
            <div className="flex h-64 items-center justify-center p-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error Loading Products</h3>
                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    <button 
                      onClick={fetchProducts}
                      className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!error && loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mb-2 text-gray-400" />
              <p className="font-semibold mb-1">
                {searchTerm ? 'No matching products found' : 'No products available'}
              </p>
              {searchTerm && (
                <p className="text-sm text-gray-400">
                  Try searching with different keywords
                </p>
              )}
              {!searchTerm && products.length === 0 && (
                <p className="text-sm text-gray-400">
                  Click "Add Product" to create your first product
                </p>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (Cost / Retail)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">StockQty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium border border-gray-200 dark:border-gray-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                       <span className="text-gray-400">₹{product.cost_price}</span> / <span className="font-medium text-green-600 dark:text-green-400">₹{product.retail_price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={product.quantity <= 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'}>
                         {product.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.status === 'ACTIVE' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-800">Active</span>}
                      {product.status === 'NEAR_EXPIRY' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">Near Expiry</span>}
                      {product.status === 'EXPIRED' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-800">Expired</span>}
                      {product.status === 'OUT_OF_STOCK' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Out of Stock</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => openQrModal(product)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(product)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-md transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                  <input 
                    name="name"
                    required
                    type="text" 
                    value={formData.name}
                    onChange={handleFormChange}
                    className="input-field" 
                    placeholder="e.g. Milk 1L"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input 
                    name="category"
                    required
                    type="text" 
                    value={formData.category}
                    onChange={handleFormChange}
                    className="input-field" 
                    placeholder="e.g. Dairy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Price (₹)</label>
                    <input 
                      name="cost_price"
                      required
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={handleFormChange}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price (₹)</label>
                    <input 
                      name="retail_price"
                      required
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formData.retail_price}
                      onChange={handleFormChange}
                      className="input-field" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                    <input 
                      name="quantity"
                      required
                      type="number" 
                      min="0"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                    <input 
                      name="expiry_date"
                      required
                      type="date" 
                      value={formData.expiry_date}
                      onChange={handleFormChange}
                      className="input-field" 
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-dark-border flex justify-end gap-3 bg-gray-50/50 dark:bg-dark-bg/10 rounded-b-2xl">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="product-form"
                disabled={formLoading}
                className="btn-primary flex items-center min-w-[120px] justify-center"
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isEditMode ? 'Save Changes' : 'Create Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrModalOpen && selectedQrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="bg-white dark:bg-dark-card w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedQrProduct.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scan code to sell or share with your point-of-sale.</p>
              </div>
              <button onClick={closeQrModal} className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 grid gap-4">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-6 flex flex-col items-center gap-4">
                <ReactQRCode value={selectedQrProduct.qr_code || selectedQrProduct._id} size={220} className="max-w-full" />
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">QR Payload</p>
                  <p className="mt-2 text-xs break-all text-gray-700 dark:text-gray-200">{selectedQrProduct.qr_code || selectedQrProduct._id}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={copyQrCode} className="btn-secondary w-full">
                  Copy QR Code
                </button>
                <button onClick={() => window.print()} className="btn-primary w-full">
                  Print/Download
                </button>
              </div>
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-950 p-4 text-sm text-gray-600 dark:text-gray-300">
                Use this QR code on shelf labels, receipts, or mobile scanners. When scanned from the app, it will trigger the sale confirmation workflow.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
