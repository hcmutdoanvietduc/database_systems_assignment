import React, { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api';

function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ materialid: '', name: '', quantity: '', item_ids: '', item_names: '' });
  const [sortBy, setSortBy] = useState('id'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  useEffect(() => {
    fetchMaterials();
  }, [sortBy, sortOrder]);

  const fetchMaterials = async () => {
    try {
      // Gửi sort parameters tới backend (Raw SQL Query)
      const sortByParam = sortBy === 'id' ? 'materialid' : sortBy;
      const res = await getMaterials(sortByParam, sortOrder);
      // Handle pagination response (res.data.results) or flat list (res.data)
      const data = res.data.results || res.data;
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể tải danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMaterial(editingId, formData);
      } else {
        await createMaterial(formData);
      }
      setFormData({ materialid: '', name: '', quantity: '', item_ids: '', item_names: '' });
      setEditingId(null);
      setError('');
      fetchMaterials();
    } catch (err) {
      console.error('Error saving material:', err);
      console.error('Error response:', err.response?.data);
      // Hiển thị lỗi chi tiết từ backend
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || Object.values(err.response?.data || {}).flat().join(', ')
        || 'Lỗi khi lưu nguyên liệu';
      setError(errorMessage);
    }
  };

  const handleEdit = (material) => {
    setEditingId(material.materialid);
    setFormData({ 
      materialid: material.materialid, 
      name: material.name, 
      quantity: material.quantity,
      item_ids: material.item_ids || '',
      item_names: material.item_names || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nguyên liệu này?')) {
      try {
        await deleteMaterial(id);
        fetchMaterials();
      } catch (err) {
        setError('Lỗi khi xóa nguyên liệu');
      }
    }
  };

  // Xóa hàm getSortedMaterials - Backend xử lý sorting bằng Raw SQL Query

  // Hàm thay đổi tiêu chí sắp xếp
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Nếu click vào cùng tiêu chí, đảo ngược thứ tự
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nếu click vào tiêu chí khác, set mới và mặc định asc
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="material-management">
      <h2>Quản Lý Nguyên Liệu</h2>
      {error && (
        <div className="error">
          {error}
          <button className="close-error" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="material-form">
        <input
          type="text"
          placeholder="Mã Nguyên Liệu (VD: M001)"
          value={formData.materialid}
          onChange={(e) => setFormData({ ...formData, materialid: e.target.value })}
          disabled={!!editingId}
          required
        />
        <input
          type="text"
          placeholder="Tên Nguyên Liệu"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Số lượng"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          min="0"
          step="1"
          required
        />
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setFormData({ materialid: '', name: '', quantity: '', item_ids: '', item_names: '' }); }}>
            Hủy
          </button>
        )}
      </form>

      {/* Bộ lọc sắp xếp */}
      <div className="sort-controls">
        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Sắp xếp theo:</span>
        <button 
          className={`sort-btn ${sortBy === 'id' ? 'active' : ''}`}
          onClick={() => handleSortChange('id')}
        >
          Mã NL {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`sort-btn ${sortBy === 'quantity' ? 'active' : ''}`}
          onClick={() => handleSortChange('quantity')}
        >
          Số Lượng {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <table className="material-table">
        <thead>
          <tr>
            <th>Mã NL</th>
            <th>Tên Nguyên Liệu</th>
            <th>Số Lượng</th>
            <th>ID Món Ăn</th>
            <th>Tên Món Ăn</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.materialid}>
              <td>{m.materialid}</td>
              <td>{m.name}</td>
              <td>{m.quantity}</td>
              <td>{m.item_ids || '--'}</td>
              <td>{m.item_names || '--'}</td>
              <td>
                <button onClick={() => handleEdit(m)}>Sửa</button>
                <button onClick={() => handleDelete(m.materialid)} className="btn-delete">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <style>{`
        .material-management { padding: 20px; }
        h2 { margin-bottom: 25px; }
        .error {
          background-color: #ffe6e6;
          color: #d32f2f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #d32f2f;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-error {
          background: none;
          border: none;
          color: #d32f2f;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          padding: 0 5px;
          line-height: 1;
          transition: transform 0.2s ease;
        }
        .close-error:hover {
          transform: scale(1.2);
          color: #b71c1c;
        }
        .material-form { 
          display: flex; 
          gap: 12px; 
          margin-bottom: 25px; 
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .material-form input { 
          padding: 12px 16px; 
          border: 2px solid #ddd; 
          border-radius: 6px;
          font-size: 15px;
          flex: 1;
          transition: border-color 0.3s ease;
        }
        .material-form input:focus {
          outline: none;
          border-color: #3498db;
        }
        .material-form button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .material-form button[type="submit"] {
          background-color: #2ecc71;
          color: white;
        }
        .material-form button[type="submit"]:hover {
          background-color: #27ae60;
          transform: translateY(-2px);
        }
        .material-form button[type="button"] {
          background-color: #95a5a6;
          color: white;
        }
        .material-form button[type="button"]:hover {
          background-color: #7f8c8d;
        }
        .sort-controls { 
          display: flex; 
          align-items: center; 
          margin-bottom: 15px; 
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .sort-btn {
          padding: 8px 16px;
          margin: 0 5px;
          border: 2px solid #ddd;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .sort-btn:hover {
          background-color: #e9ecef;
          border-color: #3498db;
        }
        .sort-btn.active {
          background-color: #3498db;
          color: white;
          border-color: #3498db;
          font-weight: bold;
        }
        .material-table { width: 100%; border-collapse: collapse; }
        .material-table th, .material-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .material-table th { background-color: #f4f4f4; }
        .btn-delete { background-color: #ff4444; color: white; margin-left: 5px; border: none; padding: 5px 10px; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default MaterialManagement;
