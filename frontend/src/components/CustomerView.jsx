import React, { useState, useEffect } from 'react';
import { getTables, getAvailableItems, createOrder, addItemToOrder } from '../api';
import './CustomerView.css';

function CustomerView() {
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, item: null, quantity: 1 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tablesRes, itemsRes] = await Promise.all([
        getTables(),
        getAvailableItems(),
      ]);
      const tablesData = tablesRes.data.results || tablesRes.data;
      const itemsData = itemsRes.data.results || itemsRes.data;
      
      setTables(Array.isArray(tablesData) ? tablesData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (table) => {
    if (table.current_order) {
      setSelectedTable(table);
      setCurrentOrder(table.current_order);
    } else {
      // Chỉ chọn bàn local, chưa tạo đơn ngay
      setSelectedTable(table);
      setCurrentOrder(null);
    }
  };

  const handleAddItem = (itemId) => {
    if (!selectedTable) {
      setError('Vui lòng chọn bàn trước!');
      return;
    }

    const item = items.find(i => i.itemid === itemId);
    setConfirmModal({ show: true, item: item, quantity: 1 });
  };

  const confirmAddItem = async () => {
    if (!confirmModal.item) return;

    try {
      let orderId;
      
      // Nếu chưa có đơn hàng, tạo mới
      if (!currentOrder) {
        const orderRes = await createOrder(selectedTable.tableid);
        orderId = orderRes.data.orderid;
      } else {
        orderId = currentOrder.orderid;
      }

      const res = await addItemToOrder(orderId, confirmModal.item.itemid, confirmModal.quantity);
      setCurrentOrder(res.data);
      setSuccess(`Đã thêm ${confirmModal.quantity} ${confirmModal.item.name}!`);
      setTimeout(() => setSuccess(null), 1500);
      setConfirmModal({ show: false, item: null, quantity: 1 });
      await loadData();
    } catch (err) {
      setError('Lỗi khi thêm món!');
      setConfirmModal({ show: false, item: null, quantity: 1 });
    }
  };

  const cancelAddItem = () => {
    setConfirmModal({ show: false, item: null, quantity: 1 });
  };

  const updateQuantity = (delta) => {
    setConfirmModal(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(99, prev.quantity + delta))
    }));
  };

  const handleReselectTable = () => {
    if (currentOrder && currentOrder.details && currentOrder.details.length > 0) {
      alert('Bạn đã gọi món, không thể đổi bàn lúc này. Vui lòng liên hệ nhân viên!');
      return;
    }
    if (window.confirm('Bạn có chắc muốn chọn lại bàn khác?')) {
      setSelectedTable(null);
      setCurrentOrder(null);
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="customer-view">
      <h1 style={{ marginTop: 0, marginBottom: '2rem' }}>🍽️ Đặt Món</h1>

      {error && <div className="error">❌ {error}</div>}
      {success && <div className="success">✅ {success}</div>}

      {/* Confirmation Modal */}
      {confirmModal.show && confirmModal.item && (
        <div className="modal-overlay" onClick={cancelAddItem}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🍽️ Xác Nhận Gọi Món</h3>
            </div>
            <div className="modal-body">
              <div className="modal-item-info">
                <div className="modal-item-icon">🍽️</div>
                <h4>{confirmModal.item.name}</h4>
                <p className="modal-item-price">₫ {Math.round(confirmModal.item.price).toLocaleString('vi-VN')}</p>
              </div>
              
              <div className="quantity-selector">
                <button className="qty-btn" onClick={() => updateQuantity(-1)} disabled={confirmModal.quantity <= 1}>
                  −
                </button>
                <span className="qty-display">{confirmModal.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(1)} disabled={confirmModal.quantity >= 99}>
                  +
                </button>
              </div>
              
              <div className="modal-total">
                <span>Tổng tiền:</span>
                <span className="modal-total-price">₫ {Math.round(confirmModal.item.price * confirmModal.quantity).toLocaleString('vi-VN')}</span>
              </div>
              
              <p className="modal-question">Bạn có chắc muốn gọi món này?</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={cancelAddItem}>
                ✕ Hủy
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmAddItem}>
                ✓ Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông tin đơn hàng hiện tại */}
      {selectedTable && (
        <div className="current-order-card">
          <div className="order-header-info">
            <div className="info-item">
              <span className="label">Bàn:</span>
              <span className="value">#{selectedTable.tablenumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Khu vực:</span>
              <span className="value">{selectedTable.area}</span>
            </div>
            {currentOrder && (
              <div className="info-item">
                <span className="label">Order ID:</span>
                <span className="value">{currentOrder.orderid}</span>
              </div>
            )}
            <button 
              className="btn-reselect" 
              onClick={handleReselectTable}
              style={{ 
                marginLeft: 'auto', 
                padding: '0.5rem 1rem', 
                backgroundColor: '#95a5a6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              🔄 Chọn lại bàn
            </button>
          </div>

          {/* Danh sách món đã gọi */}
          {currentOrder && currentOrder.details && currentOrder.details.length > 0 ? (
            <div className="ordered-items">
              <h3>Các món đã gọi:</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Món</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.details.map((detail, idx) => (
                    <tr key={idx}>
                      <td>{detail.ditemid.name}</td>
                      <td className="text-center">{detail.quantity}</td>
                      <td className="text-right">₫ {Math.round(detail.ditemid.price).toLocaleString('vi-VN')}</td>
                      <td className="text-right">
                        <strong>₫ {Math.round(detail.ditemid.price * detail.quantity).toLocaleString('vi-VN')}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="total-section">
                <span>Tổng cộng:</span>
                <span className="total-amount">
                  ₫ {Math.round(currentOrder.total_price || 0).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          ) : (
            <p className="no-items">Chưa có món nào. Chọn món bên dưới để thêm!</p>
          )}
        </div>
      )}

      {/* Chọn bàn */}
      {!selectedTable && (
        <>
          {/* Tầng 1 */}
          <div className="view-section">
            <h2 className="section-title">Tầng 1 - Sảnh</h2>
            <div className="tables-grid">
              {tables
                .filter((table) => table.tablenumber >= 101 && table.tablenumber <= 199)
                .map((table) => (
                  <div
                    key={table.tableid}
                    className={`table-card ${table.status === 'Occupied' ? 'occupied disabled' : 'available'}`}
                    onClick={() => table.status !== 'Occupied' && handleTableSelect(table)}
                    style={{ cursor: table.status === 'Occupied' ? 'not-allowed' : 'pointer', opacity: table.status === 'Occupied' ? 0.6 : 1 }}
                  >
                    <div className="table-number">#{table.tablenumber}</div>
                    <div className="table-area">{table.area}</div>
                    <div className="status">
                      {table.status === 'Occupied' ? '🔴 Bận' : '🟢 Trống'}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tầng 2 */}
          <div className="view-section">
            <h2 className="section-title">Tầng 2 - VIP</h2>
            <div className="tables-grid">
              {tables
                .filter((table) => table.tablenumber >= 201 && table.tablenumber <= 299)
                .map((table) => (
                  <div
                    key={table.tableid}
                    className={`table-card ${table.status === 'Occupied' ? 'occupied disabled' : 'available'}`}
                    onClick={() => table.status !== 'Occupied' && handleTableSelect(table)}
                    style={{ cursor: table.status === 'Occupied' ? 'not-allowed' : 'pointer', opacity: table.status === 'Occupied' ? 0.6 : 1 }}
                  >
                    <div className="table-number">#{table.tablenumber}</div>
                    <div className="table-area">{table.area}</div>
                    <div className="status">
                      {table.status === 'Occupied' ? '🔴 Bận' : '🟢 Trống'}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tầng thượng */}
          <div className="view-section">
            <h2 className="section-title">Sân Thượng</h2>
            <div className="tables-grid">
              {tables
                .filter((table) => table.tablenumber >= 301 && table.tablenumber <= 399)
                .map((table) => (
                  <div
                    key={table.tableid}
                    className={`table-card ${table.status === 'Occupied' ? 'occupied disabled' : 'available'}`}
                    onClick={() => table.status !== 'Occupied' && handleTableSelect(table)}
                    style={{ cursor: table.status === 'Occupied' ? 'not-allowed' : 'pointer', opacity: table.status === 'Occupied' ? 0.6 : 1 }}
                  >
                    <div className="table-number">#{table.tablenumber}</div>
                    <div className="table-area">{table.area}</div>
                    <div className="status">
                      {table.status === 'Occupied' ? '🔴 Bận' : '🟢 Trống'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Menu - Chỉ hiện khi đã chọn bàn */}
      {selectedTable && (
        <div className="view-section">
          <h2 className="section-title">Thực Đơn</h2>
          
          {/* Bún Phở */}
          <div className="menu-category">
            <h3 className="category-title">🍜 Bún Phở</h3>
            <div className="menu-grid-layout">
              {items
                .filter((item) => item.superitemid === 'CAT1')
                .map((item) => (
                  <div key={item.itemid} className="food-item" onClick={() => handleAddItem(item.itemid)}>
                    <div className="food-img">
                      {item.imageurl ? (
                        <img src={item.imageurl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <div className="food-info">
                      <h3>{item.name}</h3>
                      <div className="food-price">₫ {Math.round(item.price).toLocaleString('vi-VN')}</div>
                      <button className="btn-add">Gọi món</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cơm */}
          <div className="menu-category">
            <h3 className="category-title">🍚 Cơm</h3>
            <div className="menu-grid-layout">
              {items
                .filter((item) => item.superitemid === 'CAT2')
                .map((item) => (
                  <div key={item.itemid} className="food-item" onClick={() => handleAddItem(item.itemid)}>
                    <div className="food-img">
                      {item.imageurl ? (
                        <img src={item.imageurl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <div className="food-info">
                      <h3>{item.name}</h3>
                      <div className="food-price">₫ {Math.round(item.price).toLocaleString('vi-VN')}</div>
                      <button className="btn-add">Gọi món</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tráng miệng */}
          <div className="menu-category">
            <h3 className="category-title">🍰 Tráng Miệng</h3>
            <div className="menu-grid-layout">
              {items
                .filter((item) => item.superitemid === 'CAT3')
                .map((item) => (
                  <div key={item.itemid} className="food-item" onClick={() => handleAddItem(item.itemid)}>
                    <div className="food-img">
                      {item.imageurl ? (
                        <img src={item.imageurl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <div className="food-info">
                      <h3>{item.name}</h3>
                      <div className="food-price">₫ {Math.round(item.price).toLocaleString('vi-VN')}</div>
                      <button className="btn-add">Gọi món</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Đồ uống */}
          <div className="menu-category">
            <h3 className="category-title">🥤 Đồ Uống</h3>
            <div className="menu-grid-layout">
              {items
                .filter((item) => item.superitemid === 'CAT4')
                .map((item) => (
                  <div key={item.itemid} className="food-item" onClick={() => handleAddItem(item.itemid)}>
                    <div className="food-img">
                      {item.imageurl ? (
                        <img src={item.imageurl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        '🍽️'
                      )}
                    </div>
                    <div className="food-info">
                      <h3>{item.name}</h3>
                      <div className="food-price">₫ {Math.round(item.price).toLocaleString('vi-VN')}</div>
                      <button className="btn-add">Gọi món</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerView;
