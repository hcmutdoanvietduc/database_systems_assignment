import React, { useState, useEffect } from 'react';
import { getTables, getOrders, getInvoices } from '../api';
import './AdminView.css';

function AdminView() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [currentInvoicePage, setCurrentInvoicePage] = useState(1);
  const ordersPerPage = 5;
  const invoicesPerPage = 5;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Auto-refresh mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tablesRes, ordersRes, invoicesRes] = await Promise.all([
        getTables(),
        getOrders(),
        getInvoices(),
      ]);
      // Handle pagination wrapper
      const tablesData = tablesRes.data.results || tablesRes.data;
      const ordersData = ordersRes.data.results || ordersRes.data;
      const invoicesData = invoicesRes.data.results || invoicesRes.data;
      
      setTables(Array.isArray(tablesData) ? tablesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải dữ liệu...</div>;

  // Tính toán thống kê
  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
  const availableCount = tables.filter((t) => t.status === 'Available').length;
  const servingCount = orders.filter((o) => o.status === 'Serving').length;
  const paidCount = orders.filter((o) => o.status === 'Paid').length;
  
  // Tính tổng doanh thu từ tất cả orders đã thanh toán
  const totalRevenue = orders
    .filter(order => order.status === 'Paid')
    .reduce((sum, order) => {
      const orderTotal = order.details?.reduce((detailSum, detail) => {
        return detailSum + (detail.ditemid.price * detail.quantity);
      }, 0) || 0;
      return sum + orderTotal;
    }, 0);

  // Sắp xếp đơn hàng và hóa đơn mới nhất lên đầu
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdat) - new Date(a.createdat));
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.datecreated) - new Date(a.datecreated));

  // Pagination cho orders
  const indexOfLastOrder = currentOrderPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrderPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // Pagination cho invoices
  const indexOfLastInvoice = currentInvoicePage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = sortedInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalInvoicePages = Math.ceil(sortedInvoices.length / invoicesPerPage);

  return (
    <div className="admin-view">
      <h1 style={{ marginTop: 0, marginBottom: '2rem' }}>👨‍💼 Quản Lý Nhà Hàng</h1>
      
      {error && <div className="error">❌ {error}</div>}

      {/* KPI Dashboard */}
      <div className="kpi-dashboard">
        <div className="kpi-card">
          <div className="kpi-icon">🪑</div>
          <div className="kpi-label">Bàn Đang Phục Vụ</div>
          <div className="kpi-value">{occupiedCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🟢</div>
          <div className="kpi-label">Bàn Trống</div>
          <div className="kpi-value">{availableCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-label">Đơn Đang Phục Vụ</div>
          <div className="kpi-value">{servingCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Đơn Đã Thanh Toán</div>
          <div className="kpi-value">{paidCount}</div>
        </div>
        <div className="kpi-card revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-label">Tổng Doanh Thu</div>
          <div className="kpi-value">₫ {Math.round(totalRevenue).toLocaleString('vi-VN')}</div>
        </div>
      </div>

      {/* Table Distribution */}
      <div className="view-section">
        <h2 className="section-title">🗺️ Phân Bố Bàn Theo Khu Vực</h2>
        {tables.length === 0 ? (
          <p className="no-data">Chưa có bàn nào</p>
        ) : (
          <div className="area-distribution">
            {[...new Set(tables.map((t) => t.area))].map((area) => {
              const areaTables = tables.filter((t) => t.area === area);
              const areaOccupied = areaTables.filter((t) => t.status === 'Occupied').length;
              return (
                <div key={area} className="area-card">
                  <h3>{area}</h3>
                  <div className="area-stats">
                    <div className="area-stat">
                      <span className="label">Tổng:</span>
                      <span className="value">{areaTables.length}</span>
                    </div>
                    <div className="area-stat">
                      <span className="label">Đang phục vụ:</span>
                      <span className="value occupied">{areaOccupied}</span>
                    </div>
                    <div className="area-stat">
                      <span className="label">Trống:</span>
                      <span className="value available">{areaTables.length - areaOccupied}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(areaOccupied / areaTables.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Invoices */}
      <div className="view-section">
        <h2 className="section-title">💳 Danh Sách Hóa Đơn</h2>
        {invoices.length === 0 ? (
          <p className="no-data">Chưa có hóa đơn nào</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Hóa Đơn</th>
                    <th>Ngày Tạo</th>
                    <th>Khách Hàng</th>
                    <th>Thu Ngân</th>
                    <th>Thuế</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice) => (
                    <tr key={invoice.invoiceid}>
                      <td>
                        <span className="invoice-id">{invoice.invoiceid}</span>
                      </td>
                      <td>{new Date(invoice.datecreated).toLocaleString('vi-VN')}</td>
                      <td>{invoice.customerid}</td>
                      <td>{invoice.istaffid}</td>
                      <td className="amount">
                        ₫ {Math.round(invoice.tax || 0).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for Invoices */}
            {totalInvoicePages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentInvoicePage(prev => Math.max(prev - 1, 1))}
                  disabled={currentInvoicePage === 1}
                >
                  ← Trước
                </button>
                
                <div className="page-numbers">
                  {[...Array(totalInvoicePages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`page-number ${currentInvoicePage === index + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentInvoicePage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="page-btn"
                  onClick={() => setCurrentInvoicePage(prev => Math.min(prev + 1, totalInvoicePages))}
                  disabled={currentInvoicePage === totalInvoicePages}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details */}
      <div className="view-section">
        <h2 className="section-title">📋 Chi Tiết Đơn Hàng</h2>
        {orders.length === 0 ? (
          <p className="no-data">Chưa có đơn hàng nào</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Trạng Thái</th>
                    <th>Số Lượng</th>
                    <th>Bàn</th>
                    <th>Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                    <tr key={order.orderid}>
                      <td>
                        <span className="order-id">{order.orderid}</span>
                      </td>
                      <td>
                        <span
                          className={`status status-${order.status.toLowerCase()}`}
                        >
                          {order.status === 'Serving' ? '🔄 Đang phục vụ' : '✅ Đã thanh toán'}
                        </span>
                      </td>
                      <td>{order.quantity}</td>
                      <td>#{order.otableid}</td>
                      <td>{new Date(order.createdat).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for Orders */}
            {totalOrderPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentOrderPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentOrderPage === 1}
                >
                  ← Trước
                </button>
                
                <div className="page-numbers">
                  {[...Array(totalOrderPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`page-number ${currentOrderPage === index + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentOrderPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="page-btn"
                  onClick={() => setCurrentOrderPage(prev => Math.min(prev + 1, totalOrderPages))}
                  disabled={currentOrderPage === totalOrderPages}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Table Distribution - moved to end */}
      <div className="view-section">
        <h2 className="section-title">🗺️ Phân Bố Bàn Theo Khu Vực</h2>
        {tables.length === 0 ? (
          <p className="no-data">Chưa có bàn nào</p>
        ) : (
          <div className="area-distribution">
            {[...new Set(tables.map((t) => t.area))].map((area) => {
              const areaTables = tables.filter((t) => t.area === area);
              const areaOccupied = areaTables.filter((t) => t.status === 'Occupied').length;
              return (
                <div key={area} className="area-card">
                  <h3>{area}</h3>
                  <div className="area-stats">
                    <div className="area-stat">
                      <span className="label">Tổng:</span>
                      <span className="value">{areaTables.length}</span>
                    </div>
                    <div className="area-stat">
                      <span className="label">Đang phục vụ:</span>
                      <span className="value occupied">{areaOccupied}</span>
                    </div>
                    <div className="area-stat">
                      <span className="label">Trống:</span>
                      <span className="value available">{areaTables.length - areaOccupied}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(areaOccupied / areaTables.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminView;
