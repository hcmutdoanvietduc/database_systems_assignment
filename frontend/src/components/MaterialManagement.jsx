import React, { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api';

function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ materialid: '', name: '', quantity: '' });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials();
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
      setFormData({ materialid: '', name: '', quantity: '' });
      setEditingId(null);
      fetchMaterials();
    } catch (err) {
      setError('Lỗi khi lưu nguyên liệu');
    }
  };

  const handleEdit = (material) => {
    setEditingId(material.materialid);
    setFormData({ materialid: material.materialid, name: material.name, quantity: material.quantity });
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

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="material-management">
      <h2>📦 Quản Lý Nguyên Liệu</h2>
      {error && <div className="error">{error}</div>}

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
          required
        />
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setFormData({ materialid: '', name: '', quantity: '' }); }}>
            Hủy
          </button>
        )}
      </form>

      <table className="material-table">
        <thead>
          <tr>
            <th>Mã NL</th>
            <th>Tên Nguyên Liệu</th>
            <th>Số Lượng</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.materialid}>
              <td>{m.materialid}</td>
              <td>{m.name}</td>
              <td>{m.quantity}</td>
              <td>
                <button onClick={() => handleEdit(m)}>Sửa</button>
                <button onClick={() => handleDelete(m.materialid)} className="btn-delete">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <style jsx>{`
        .material-management { padding: 20px; }
        .material-form { display: flex; gap: 10px; margin-bottom: 20px; }
        .material-form input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .material-table { width: 100%; border-collapse: collapse; }
        .material-table th, .material-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .material-table th { background-color: #f4f4f4; }
        .btn-delete { background-color: #ff4444; color: white; margin-left: 5px; border: none; padding: 5px 10px; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default MaterialManagement;
