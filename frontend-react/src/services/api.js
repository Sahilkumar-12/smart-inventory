import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', // FastAPI backend without /api
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 Unauthorized (e.g., token expired or fake token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (data) => api.post('/auth/google-login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const productService = {
  getAll: () => api.get('/products/'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const salesService = {
  recordSale: (saleData) => api.post('/sales/', saleData),
  getHistory: () => api.get('/sales/'),
  scanSale: (scanData) => api.post('/sales/scan', scanData),
};

export const reportService = {
  generate: () => api.post('/reports/'),
  getAll: () => api.get('/reports/')
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/summary'),
};

export default api;
