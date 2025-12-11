import React, { useState, useEffect } from 'react';
import { getTables, completeOrder, updateTable, deleteOrder } from '../api';
import './StaffView.css';

function StaffView() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTables = async () => {
    try {
      const res = await getTables();
      const tablesData = res.data.results || res.data;
      setTables(Array.isArray(tablesData) ? tablesData : []);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu bàn!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setCustomerInfo({ name: '', phone: '' });
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      setError('Vui lòng nhập đầy đủ tên và số điện thoại khách hàng!');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await completeOrder(selectedOrderId, {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim()
      });
      setSuccess('Đã hoàn thành đơn hàng và lưu thông tin khách hàng!');
      setShowPaymentModal(false);
      setCustomerInfo({ name: '', phone: '' });
      await loadTables();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Lỗi khi hoàn thành đơn!';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Hóa đơn liên quan cũng sẽ bị xóa!')) {
      return;
    }

    try {
      await deleteOrder(orderId);
      setSuccess('Đã xóa đơn hàng và hóa đơn!');
      await loadTables();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Lỗi khi xóa đơn hàng!');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  const occupiedTables = tables.filter((t) => t.status === 'Occupied' || t.status === 'Reserved');
  const availableTables = tables.filter((t) => t.status === 'Available');

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await updateTable(tableId, { status: newStatus });
      loadTables();
    } catch (err) {
      setError('Không thể cập nhật trạng thái bàn!');
    }
  };

  return (
    <div className="staff-view">
      <h1 style={{ marginTop: 0, marginBottom: '2rem' }}>Quản Lý Đơn Hàng</h1>

      {error && <div className="error">❌ {error}</div>}
      {success && <div className="success">✅ {success}</div>}

      {/* Dashboard Summary */}
      <div className="dashboard-summary">
        <div className="summary-card" style={{ borderLeftColor: '#e74c3c' }}>
          <div className="summary-icon">🔴</div>
          <div className="summary-value">{occupiedTables.length}</div>
          <div className="summary-label">Đang Phục Vụ / Đặt Trước</div>
        </div>
        <div className="summary-card" style={{ borderLeftColor: '#27ae60' }}>
          <div className="summary-icon">🟢</div>
          <div className="summary-value">{availableTables.length}</div>
          <div className="summary-label">Bàn Trống</div>
        </div>
        <div className="summary-card" style={{ borderLeftColor: '#3498db' }}>
          <div className="summary-icon">🪑</div>
          <div className="summary-value">{tables.length}</div>
          <div className="summary-label">Tổng Bàn</div>
        </div>
      </div>

      {/* Table Management Section */}
      <div className="view-section">
        <h2 className="section-title">📋 Quản Lý Bàn</h2>
        <div className="tables-grid">
          {tables.map((table) => (
            <div 
              key={table.tableid} 
              className={`table-card ${table.status.toLowerCase()}`}
            >
              <div className="table-header">
                <span className="table-number">Bàn {table.tablenumber}</span>
                <span className="table-area">{table.area}</span>
              </div>
              
              <div className="table-status-control">
                <div className={`status-badge ${table.status.toLowerCase()}`}>
                  {table.status === 'Available' ? '🟢 Trống' : 
                   table.status === 'Occupied' ? '🔴 Có Khách' : '🟡 Đặt Trước'}
                </div>
                
                <div className="status-actions">
                  {table.status !== 'Available' && (
                    <button 
                      className="action-btn btn-available"
                      onClick={() => handleStatusChange(table.tableid, 'Available')}
                      title="Đánh dấu là Trống"
                    >
                      🟢
                    </button>
                  )}
                  {table.status !== 'Occupied' && (
                    <button 
                      className="action-btn btn-occupied"
                      onClick={() => handleStatusChange(table.tableid, 'Occupied')}
                      title="Đánh dấu là Có Khách"
                    >
                      🔴
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders in Progress */}
      <div className="view-section">
        <h2 className="section-title">📋 Đơn Hàng Đang Phục Vụ</h2>

        {occupiedTables.filter(t => t.current_order).length === 0 ? (
          <div className="no-data">
            <div style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Không có đơn hàng</div>
            <p>Không có đơn hàng nào đang phục vụ!</p>
            <small>Hệ thống sẽ tự động cập nhật khi có đơn mới</small>
          </div>
        ) : (
          <div className="orders-list">
            {occupiedTables.filter(t => t.current_order).map((table) => {
              const order = table.current_order;
              const totalPrice = order.total_price || 0;

              return (
                <div key={table.tableid} className="order-card">
                  <div className="order-card-header">
                    <div className="table-info-line">
                      <span className="table-badge">Bàn #{table.tablenumber}</span>
                      <span className="area-text">{table.area}</span>
                    </div>
                    <div className="order-id-badge">
                      <span className="order-label">Order ID:</span>
                      <span className="order-value">{order.orderid}</span>
                    </div>
                  </div>

                  {order.details && order.details.length > 0 ? (
                    <div className="order-items">
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th className="col-name">MÓN</th>
                            <th className="col-qty">SL</th>
                            <th className="col-price">GIÁ</th>
                            <th className="col-total">TỔNG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.details.map((detail, idx) => (
                            <tr key={idx}>
                              <td className="col-name">
                                <strong>{detail.ditemid.name}</strong>
                              </td>
                              <td className="col-qty">
                                <span className="qty-badge">{detail.quantity}</span>
                              </td>
                              <td className="col-price">
                                ₫ {Math.round(detail.ditemid.price).toLocaleString('vi-VN')}
                              </td>
                              <td className="col-total">
                                <strong>₫ {Math.round(detail.ditemid.price * detail.quantity).toLocaleString('vi-VN')}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-items">Chưa có món nào</p>
                  )}

                  <div className="order-card-footer">
                    <div className="total">
                      <span>TỔNG CỘNG:</span>
                      <span className="total-value">₫ {Math.round(totalPrice).toLocaleString('vi-VN')}</span>
                    </div>
                    <button
                      className="btn-complete"
                      onClick={() => handleCompleteOrder(order.orderid)}
                    >
                      ✓ Hoàn Thành
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thanh Toán */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Thông Tin Khách Hàng</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmPayment(); }}>
              <div className="form-group">
                <label>Tên Khách Hàng *</label>
                <input
                  type="text"
                  placeholder="Nhập tên khách hàng"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-confirm">
                  Xác Nhận Thanh Toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffView;
