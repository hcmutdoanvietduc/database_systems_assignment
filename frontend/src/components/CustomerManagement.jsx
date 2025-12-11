import React, { useState, useEffect } from 'react';
import './CustomerManagement.css';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/customers/');
      const data = await response.json();
      setCustomers(data.results || data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách khách hàng!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerInvoices = async (customerId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/invoices/?customer_id=${customerId}`);
      const data = await response.json();
      setCustomerInvoices(data.results || data);
    } catch (err) {
      console.error('Không thể tải hóa đơn khách hàng:', err);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    loadCustomerInvoices(customer.customerid);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.customerid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="customer-management">
      <h2>Quản Lý Khách Hàng</h2>
      
      {error && <div className="error">{error}</div>}

      <div className="customer-container">
        {/* Danh sách khách hàng */}
        <div className="customer-list-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT hoặc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="customer-stats">
            <div className="stat-card">
              <div className="stat-value">{customers.length}</div>
              <div className="stat-label">Tổng Khách Hàng</div>
            </div>
          </div>

          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Mã KH</th>
                  <th>Họ Tên</th>
                  <th>Số Điện Thoại</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.customerid}
                    className={selectedCustomer?.customerid === customer.customerid ? 'selected' : ''}
                  >
                    <td>{customer.customerid}</td>
                    <td>{customer.fullname}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <button 
                        className="btn-view"
                        onClick={() => handleCustomerClick(customer)}
                      >
                        Xem Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chi tiết khách hàng và hóa đơn */}
        {selectedCustomer && (
          <div className="customer-detail-section">
            <div className="customer-info-card">
              <h3>Thông Tin Khách Hàng</h3>
              <div className="info-row">
                <span className="label">Mã KH:</span>
                <span className="value">{selectedCustomer.customerid}</span>
              </div>
              <div className="info-row">
                <span className="label">Họ Tên:</span>
                <span className="value">{selectedCustomer.fullname}</span>
              </div>
              <div className="info-row">
                <span className="label">SĐT:</span>
                <span className="value">{selectedCustomer.phone}</span>
              </div>
            </div>

            <div className="invoices-section">
              <h3>Danh Sách Hóa Đơn</h3>
              {customerInvoices.length === 0 ? (
                <p className="no-data">Khách hàng chưa có hóa đơn nào</p>
              ) : (
                <div className="invoices-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã HĐ</th>
                        <th>Ngày Tạo</th>
                        <th>Thuế</th>
                        <th>Thu Ngân</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInvoices.map((invoice) => (
                        <tr key={invoice.invoiceid}>
                          <td>{invoice.invoiceid}</td>
                          <td>{new Date(invoice.datecreated).toLocaleString('vi-VN')}</td>
                          <td>₫{Math.round(invoice.tax).toLocaleString('vi-VN')}</td>
                          <td>{invoice.istaffid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerManagement;
