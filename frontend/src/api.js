import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Request Interceptor to attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add Response Interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Không có refresh token -> Logout
          logout();
          return Promise.reject(error);
        }

        // Gọi API refresh token
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        // Retry request ban đầu với token mới
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn -> Logout
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const login = (username, password) => {
  return api.post('/login/', { username, password });
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
  window.location.href = '/'; // Force reload to clear state
};

// ==================== ITEMS ====================
export const getItems = () => {
  return api.get('/items/');
};

export const getAvailableItems = () => {
  return api.get('/items/available/');
};

export const getItemDetail = (itemId) => {
  return api.get(`/items/${itemId}/`);
};

// ==================== TABLES ====================
export const getTables = () => {
  return api.get('/tables/');
};

export const getTableDetail = (tableId) => {
  return api.get(`/tables/${tableId}/`);
};

export const updateTable = (tableId, data) => {
  return api.patch(`/tables/${tableId}/`, data);
};

// ==================== ORDERS ====================
export const getOrders = () => {
  return api.get('/orders/');
};

export const getOrderDetail = (orderId) => {
  return api.get(`/orders/${orderId}/`);
};

export const createOrder = (tableId) => {
  return api.post('/orders/', { otableid: tableId });
};

export const addItemToOrder = (orderId, itemId, quantity) => {
  return api.post(`/orders/${orderId}/add_item/`, {
    ditemid: itemId,
    quantity: quantity,
  });
};

export const completeOrder = (orderId) => {
  return api.post(`/orders/${orderId}/complete/`);
};

export const deleteOrder = (orderId) => {
  return api.delete(`/orders/${orderId}/delete_order/`);
};

// ==================== CUSTOMERS ====================
export const getCustomers = () => {
  return api.get('/customers/');
};

export const getCustomerDetail = (customerId) => {
  return api.get(`/customers/${customerId}/`);
};

// ==================== INVOICES ====================
export const getInvoices = () => {
  return api.get('/invoices/');
};

export const getInvoiceDetail = (invoiceId) => {
  return api.get(`/invoices/${invoiceId}/`);
};

// ==================== PROMOTIONS ====================
export const getPromotions = () => {
  return api.get('/promotions/');
};

// ==================== STAFF ====================
export const getStaff = (role) => {
  let url = '/staff/';
  if (role) {
    url += `?role=${role}`;
  }
  return api.get(url);
};

export const addStaff = (data) => {
  return api.post('/staff/add_staff/', data);
};

export const updateStaff = (staffId, data) => {
  return api.put(`/staff/${staffId}/update_staff/`, data);
};

export const deleteStaff = (staffId) => {
  return api.delete(`/staff/${staffId}/`);
};

// ==================== CHEFS ====================
export const getChefs = () => {
  return api.get('/chefs/');
};

export default api;
// ==================== MATERIALS ====================
export const getMaterials = (sortBy, order) => {
  let url = '/materials/';
  if (sortBy) {
    url += `?sort_by=${sortBy}&order=${order || 'asc'}`;
  }
  return api.get(url);
};

export const createMaterial = (data) => {
  return api.post('/materials/', data);
};

export const updateMaterial = (id, data) => {
  return api.put(`/materials/${id}/`, data);
};

export const deleteMaterial = (id) => {
  return api.delete(`/materials/${id}/`);
};

// ==================== REVENUE ====================
export const getRevenueStats = () => {
  return api.get('/revenue/');
};
