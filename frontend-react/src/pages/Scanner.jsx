import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { salesService } from '../services/api';
import { Box, CheckCircle2, AlertTriangle, RotateCw, CloudCheck, Camera, Type } from 'lucide-react';

const Scanner = () => {
  const [scanText, setScanText] = useState('');
  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSell, setAutoSell] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const manualInputRef = useRef(null);

  const fetchProduct = async (code) => {
    if (!code || code.trim() === '') {
      toast.warning('Please enter or scan a valid QR code');
      return;
    }

    setLoading(true);
    setProductReady(false);
    try {
      const res = await salesService.scanSale({ qr_code: code.trim(), confirm: false });
      setScanText(code.trim());
      setProduct(res.data.product);
      setProductReady(true);
      toast.info('QR code recognized. Confirm sale or enable Auto Sell.');
      setManualInput('');
      if (autoSell) {
        await confirmSale(code.trim());
      }
    } catch (error) {
      setProduct(null);
      setProductReady(false);
      toast.error(error.response?.data?.detail || 'Unable to find product from QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    fetchProduct(manualInput);
  };

  const confirmSale = async (code) => {
    if (!code) {
      toast.warning('Scan a valid QR code first');
      return;
    }

    setLoading(true);
    try {
      const res = await salesService.scanSale({ qr_code: code, confirm: true });
      setProduct(res.data.product);
      setProductReady(false);
      toast.success('Sale recorded successfully!');
      setScanText('');
      setManualInput('');
      setProduct(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Sale confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl shadow-inner border border-primary-200 dark:border-primary-800">
              <Box className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Scan & Sell</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Use the camera to scan a product QR code and complete sales instantly.</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAutoSell((current) => !current)}
          className={`btn-secondary ${autoSell ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
        >
          <RotateCw className="w-4 h-4 mr-2" />
          {autoSell ? 'Auto Sell Enabled' : 'Enable Auto Sell'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">QR Code Scanner</h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Enter or scan the product QR code</span>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Type className="h-5 w-5" />
              </div>
              <input
                ref={manualInputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR code here or scan with device camera"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="w-full btn-primary py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Scanning...' : 'Scan QR Code'}
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Last scanned</p>
              <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 break-words font-mono text-xs">{scanText || 'Waiting for scan...'}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</p>
              <p className={`mt-2 text-sm font-semibold ${productReady ? 'text-emerald-700 dark:text-emerald-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
                {loading ? 'Processing...' : productReady ? 'Product ready' : 'No product selected'}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sale Preview</h2>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4" /> Ready to confirm
            </div>
          </div>

          {product ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Product</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{product.name}</p>
                  </div>
                  <div className="inline-flex items-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 px-4 py-2 text-sm font-semibold text-primary-700 dark:text-primary-200">
                    ₹{product.price.toFixed(2)}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Stock</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{product.quantity}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Expiry</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => confirmSale(scanText)}
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Confirming sale...' : 'Confirm Sale'}
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-orange-500" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Scan a QR code to preview product details and complete the sale.</p>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 p-5">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <CloudCheck className="w-4 h-4" />
              <span className="text-sm">Sale history updates automatically on success.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
