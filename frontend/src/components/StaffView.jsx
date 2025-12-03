import React, { useState, useEffect } from 'react';
import { getTables, completeOrder } from '../api';
import './StaffView.css';

function StaffView() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Xác nhận đã thanh toán xong?')) {
      return;
    }

    try {
      await completeOrder(orderId);
      setSuccess('Đã hoàn thành đơn hàng!');
      await loadTables(); // Đảm bảo load xong trước khi hiện success
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Lỗi khi hoàn thành đơn!');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  const occupiedTables = tables.filter((t) => t.status === 'Occupied' && t.current_order);
  const availableTables = tables.filter((t) => t.status === 'Available');

  return (
    <div className="staff-view">
      <h1 style={{ marginTop: 0, marginBottom: '2rem' }}>👨‍💼 Quản Lý Đơn Hàng</h1>

      {error && <div className="error">❌ {error}</div>}
      {success && <div className="success">✅ {success}</div>}

      {/* Dashboard Summary */}
      <div className="dashboard-summary">
        <div className="summary-card" style={{ borderLeftColor: '#e74c3c' }}>
          <div className="summary-icon">🔴</div>
          <div className="summary-value">{occupiedTables.length}</div>
          <div className="summary-label">Đang Phục Vụ</div>
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
        <div className="summary-card" style={{ borderLeftColor: '#9b59b6' }}>
          <div className="summary-icon">📋</div>
          <div className="summary-value">{occupiedTables.length}</div>
          <div className="summary-label">Tổng Đơn</div>
        </div>
      </div>

      {/* Available Tables */}
      <div className="view-section">
        <h2 className="section-title">🟢 Bàn Trống ({availableTables.length})</h2>

        {availableTables.length === 0 ? (
          <div className="no-data">
            <p>Tất cả bàn đang được sử dụng!</p>
          </div>
        ) : (
          <div className="available-tables">
            {availableTables.map((table) => (
              <div key={table.tableid} className="available-card">
                <div className="available-number">#{table.tablenumber}</div>
                <div className="available-area">{table.area}</div>
                <div className="available-status">🟢 Sẵn sàng</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders in Progress */}
      <div className="view-section">
        <h2 className="section-title">📋 Đơn Hàng Đang Phục Vụ</h2>

        {occupiedTables.length === 0 ? (
          <div className="no-data">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
            <p>Không có đơn hàng nào đang phục vụ!</p>
            <small>Hệ thống sẽ tự động cập nhật khi có đơn mới</small>
          </div>
        ) : (
          <div className="orders-list">
            {occupiedTables.map((table) => {
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
    </div>
  );
}

export default StaffView;
