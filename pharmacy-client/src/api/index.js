import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts       = (params) => apiClient.get('/products', { params }).then(r => r.data);
export const getProductById    = (id)     => apiClient.get(`/products/${id}`).then(r => r.data);
export const createProduct     = (data)   => apiClient.post('/products', data).then(r => r.data);
export const updateProduct     = (id, data) => apiClient.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct     = (id)     => apiClient.delete(`/products/${id}`);
export const getExpiringProducts = (days = 30) => apiClient.get('/products/expiring', { params: { days } }).then(r => r.data);
export const writeOffExpired   = ()       => apiClient.post('/products/write-off-expired').then(r => r.data);
export const batchWriteOff     = (productIds, reason) => apiClient.post('/products/batch-write-off', { productIds, reason }).then(r => r.data);

// ── Categories & Classes ──────────────────────────────────────────────────────
export const getCategories     = ()       => apiClient.get('/categories').then(r => r.data);
export const createCategory    = (data)   => apiClient.post('/categories', data).then(r => r.data);
export const getClasses        = (categoryId) => apiClient.get('/classes', { params: { categoryId } }).then(r => r.data);
export const createClass       = (data)   => apiClient.post('/classes', data).then(r => r.data);

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const getSuppliers      = ()       => apiClient.get('/suppliers').then(r => r.data);
export const createSupplier    = (data)   => apiClient.post('/suppliers', data).then(r => r.data);
export const updateSupplier    = (id, data) => apiClient.put(`/suppliers/${id}`, data).then(r => r.data);
export const deleteSupplier    = (id)     => apiClient.delete(`/suppliers/${id}`);

// ── Supplies ──────────────────────────────────────────────────────────────────
export const getSupplies       = ()       => apiClient.get('/supplies').then(r => r.data);
export const getSupplyById     = (id)     => apiClient.get(`/supplies/${id}`).then(r => r.data);
export const createSupply      = (data)   => apiClient.post('/supplies', data).then(r => r.data);

// ── Returns ───────────────────────────────────────────────────────────────────
export const createReturn      = (data)   => apiClient.post('/returns', data).then(r => r.data);

// ── Sales ─────────────────────────────────────────────────────────────────────
export const getSales          = (params) => apiClient.get('/sales', { params }).then(r => r.data);
export const getSaleById       = (id)     => apiClient.get(`/sales/${id}`).then(r => r.data);
export const registerSale      = (data)   => apiClient.post('/sales', data).then(r => r.data);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getSummaryReport  = (params) => apiClient.get('/reports/summary', { params }).then(r => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login             = (data)   => apiClient.post('/auth/login', data).then(r => r.data);
export const registerUser      = (data)   => apiClient.post('/auth/register', data).then(r => r.data);

// ── Orders & Users ──────────────────────────────────────────────────────────
export const createOrder       = (data)   => apiClient.post('/orders', data).then(r => r.data);
export const getMyOrders       = ()       => apiClient.get('/orders/my').then(r => r.data);
export const getOrders         = ()       => apiClient.get('/orders').then(r => r.data);
export const updateOrderStatus = (id, status) => apiClient.put(`/orders/${id}/status`, { status }).then(r => r.data);
export const getOrderById      = (id)     => apiClient.get(`/orders/${id}`).then(r => r.data);

export const getUsers          = ()       => apiClient.get('/users').then(r => r.data);
export const updateUserRole    = (id, role) => apiClient.put(`/users/${id}/role`, { role }).then(r => r.data);
export const deleteUser        = (id)     => apiClient.delete(`/users/${id}`);
