import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  return api.put(`/tables/${tableId}/`, data);
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
export const getStaff = () => {
  return api.get('/staff/');
};

// ==================== CHEFS ====================
export const getChefs = () => {
  return api.get('/chefs/');
};

export default api;
