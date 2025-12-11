import React, { useState, useEffect } from 'react';
import { getStaff, addStaff, updateStaff, deleteStaff } from '../api';
import axios from 'axios';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, chef, cashier, waiter
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add or edit
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    manager_id: 'MGR01',
    role: 'Chef',
    status: 'Working',
    role_detail: ''  // Experience/Education/Fluency
  });

  useEffect(() => {
    fetchStaffData(activeTab);
  }, [activeTab]);

  const fetchStaffData = async (role = 'all') => {
    try {
      setLoading(true);
      const API_BASE = 'http://127.0.0.1:8000/api';
      const token = localStorage.getItem('accessToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Gọi API staff với role filter (sử dụng Raw SQL Query ở backend)
      const [staffRes, chefsRes, cashiersRes, waitersRes] = await Promise.all([
        axios.get(`${API_BASE}/staff/?role=${role}`, config),
        axios.get(`${API_BASE}/chefs/`, config),
        axios.get(`${API_BASE}/cashiers/`, config),
        axios.get(`${API_BASE}/waiters/`, config)
      ]);

      const staffData = staffRes.data.results || staffRes.data;
      const chefsData = chefsRes.data.results || chefsRes.data;
      const cashiersData = cashiersRes.data.results || cashiersRes.data;
      const waitersData = waitersRes.data.results || waitersRes.data;

      setStaff(Array.isArray(staffData) ? staffData : []);
      setChefs(Array.isArray(chefsData) ? chefsData : []);
      setCashiers(Array.isArray(cashiersData) ? cashiersData : []);
      setWaiters(Array.isArray(waitersData) ? waitersData : []);
      
      setError('');
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setModalMode('add');
    setSelectedStaff(null);
    setFormData({
      name: '',
      phone: '',
      manager_id: 'MGR01',
      role: 'Chef',
      status: 'Working',
      role_detail: ''
    });
    setShowModal(true);
  };

  const handleEditStaff = (s) => {
    setModalMode('edit');
    setSelectedStaff(s);
    setFormData({
      name: s.fullname,
      phone: s.phone,
      status: s.status || 'Working',
      role_detail: s.detail || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {
        await addStaff(formData);
        setSuccess('Thêm nhân viên thành công!');
      } else {
        await updateStaff(selectedStaff.staffid, formData);
        setSuccess('Cập nhật nhân viên thành công!');
      }
      
      setShowModal(false);
      fetchStaffData(activeTab);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving staff:', err);
      setError(err.response?.data?.error || 'Lỗi khi lưu nhân viên!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      return;
    }
    
    try {
      await deleteStaff(staffId);
      setSuccess('Xóa nhân viên thành công!');
      fetchStaffData(activeTab);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError('Lỗi khi xóa nhân viên!');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Backend đã trả về role và detail trong query, không cần logic client-side
  const formatDetail = (role, detail) => {
    if (!detail) return '';
    if (role === 'Đầu Bếp') return `Kinh nghiệm: ${detail} năm`;
    if (role === 'Thu Ngân') return `Trình độ: ${detail}`;
    if (role === 'Phục Vụ') return `Ngôn ngữ: ${detail}`;
    return '';
  };

  // Backend đã xử lý filter bằng Raw SQL Query

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="staff-management">
      <h2>Quản Lý Nhân Viên</h2>
      
      {error && (
        <div className="error">
          {error}
          <button className="close-error" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {success && (
        <div className="success">
          {success}
          <button className="close-error" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <label htmlFor="role-filter">Lọc theo chức vụ:</label>
        <select 
          id="role-filter"
          className="role-filter"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="all">Tất Cả ({staff.length})</option>
          <option value="chef">Đầu Bếp ({chefs.length})</option>
          <option value="cashier">Thu Ngân ({cashiers.length})</option>
          <option value="waiter">Phục Vụ ({waiters.length})</option>
        </select>
      </div>

      {/* Add Button */}
      <div className="add-button-section">
        <button className="btn-add" onClick={handleAddStaff}>
          + Thêm Nhân Viên
        </button>
      </div>

      {/* Staff Table */}
      <div className="table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ Tên</th>
              <th>Chức Vụ</th>
              <th>Số Điện Thoại</th>
              <th>Trạng Thái</th>
              <th>Chi Tiết</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  Không có nhân viên nào
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.staffid}>
                  <td><strong>{s.staffid}</strong></td>
                  <td>{s.fullname}</td>
                  <td>
                    <span className={`role-badge role-${(s.role || 'Nhân Viên').toLowerCase().replace(' ', '-')}`}>
                      {s.role || 'Nhân Viên'}
                    </span>
                  </td>
                  <td>{s.phone || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${s.status?.toLowerCase() || 'working'}`}>
                      {s.status === 'Working' ? 'Đang làm' : 
                       s.status === 'Retired' ? 'Nghỉ hưu' : 
                       s.status === 'On Leave' ? 'Nghỉ phép' : s.status}
                    </span>
                  </td>
                  <td>{formatDetail(s.role, s.detail)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEditStaff(s)}>
                        Sửa
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteStaff(s.staffid)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{modalMode === 'add' ? 'Thêm Nhân Viên Mới' : 'Cập Nhật Nhân Viên'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Họ Tên *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>

              {modalMode === 'add' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Chức Vụ *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="Chef">Đầu Bếp</option>
                      <option value="Cashier">Thu Ngân</option>
                      <option value="Waiter">Phục Vụ</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Quản Lý *</label>
                    <select
                      value={formData.manager_id}
                      onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                      required
                    >
                      <option value="MGR01">MGR01 - Hoàng Văn Hùng</option>
                      <option value="MGR02">MGR02 - Đỗ Thị Mai</option>
                      <option value="MGR03">MGR03 - Ngô Văn Nam</option>
                      <option value="MGR04">MGR04 - Bùi Thị Lan</option>
                      <option value="MGR05">MGR05 - Vũ Văn Khôi</option>
                    </select>
                  </div>
                </div>
              )}

              {modalMode === 'edit' && (
                <div className="form-group">
                  <label>Trạng Thái *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="Working">Đang làm</option>
                    <option value="On Leave">Nghỉ phép</option>
                    <option value="Retired">Nghỉ hưu</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>
                  {(formData.role === 'Chef' || selectedStaff?.role === 'Đầu Bếp') && 'Kinh Nghiệm (năm)'}
                  {(formData.role === 'Cashier' || selectedStaff?.role === 'Thu Ngân') && 'Trình Độ'}
                  {(formData.role === 'Waiter' || selectedStaff?.role === 'Phục Vụ') && 'Ngoại Ngữ'}
                </label>
                <input
                  type={formData.role === 'Chef' || selectedStaff?.role === 'Đầu Bếp' ? 'number' : 'text'}
                  value={formData.role_detail}
                  onChange={(e) => setFormData({...formData, role_detail: e.target.value})}
                  placeholder={
                    formData.role === 'Chef' || selectedStaff?.role === 'Đầu Bếp' ? 'VD: 5' :
                    formData.role === 'Cashier' || selectedStaff?.role === 'Thu Ngân' ? 'VD: Đại học Kinh Tế' :
                    'VD: Tiếng Anh, Tiếng Trung'
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {modalMode === 'add' ? 'Thêm' : 'Cập Nhật'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .staff-management {
          padding: 20px;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .add-button-section {
          margin-bottom: 20px;
          text-align: center;
        }
        
        .btn-add {
          background: #27ae60;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          max-width: 100%;
        }
        
        .btn-add:hover {
          background: #229954;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .btn-edit {
          background: #3498db;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-edit:hover {
          background: #2980b9;
        }
        
        .btn-delete {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-delete:hover {
          background: #c0392b;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content h3 {
          margin: 0 0 20px 0;
          color: #333;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .btn-submit {
          background: #27ae60;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-submit:hover {
          background: #229954;
        }
        
        .btn-cancel {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel:hover {
          background: #7f8c8d;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #28a745;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        h2 {
          margin-bottom: 25px;
        }
        
        .error {
          background-color: #ffe6e6;
          color: #d32f2f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #d32f2f;
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
          transition: transform 0.2s ease;
        }
        
        .close-error:hover {
          transform: scale(1.2);
        }
        
        .filter-section {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .filter-section label {
          font-weight: 600;
          color: #333;
        }
        
        .role-filter {
          padding: 8px 12px;
          padding-left: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 15px;
          background: white;
          cursor: pointer;
          transition: border-color 0.3s ease;
          min-width: 200px;
        }
        
        .role-filter:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .role-filter:hover {
          border-color: #3498db;
        }
        
        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .staff-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .staff-table th,
        .staff-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .staff-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        
        .staff-table tbody tr:hover {
          background-color: #f5f5f5;
        }
        
        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .role-badge.role-đầu-bếp {
          background-color: #ff6b6b;
          color: white;
        }
        
        .role-badge.role-thu-ngân {
          background-color: #4ecdc4;
          color: white;
        }
        
        .role-badge.role-phục-vụ {
          background-color: #95e1d3;
          color: #333;
        }
        
        .role-badge.role-nhân-viên {
          background-color: #ddd;
          color: #666;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .status-badge.status-working {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-badge.status-retired {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status-badge.status-on-leave {
          background-color: #fff3cd;
          color: #856404;
        }
      `}</style>
    </div>
  );
}

export default StaffManagement;
