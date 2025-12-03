import React, { useState } from 'react';
import './LoginView.css';

function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'customer',
      name: 'Khách Hàng',
      icon: '👤',
      description: 'Xem bàn và đặt món',
      color: '#3498db'
    },
    {
      id: 'staff',
      name: 'Nhân Viên',
      icon: '👨‍💼',
      description: 'Quản lý đơn hàng',
      color: '#9b59b6'
    },
    {
      id: 'admin',
      name: 'Quản Lý',
      icon: '📊',
      description: 'Thống kê & báo cáo',
      color: '#e74c3c'
    }
  ];

  const handleLogin = () => {
    if (selectedRole) {
      onLogin(selectedRole);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-header">
          <h1>🍽️ HỆ THỐNG NHÀ HÀNG</h1>
          <p>Chọn vai trò của bạn để tiếp tục</p>
        </div>

        <div className="roles-grid">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => setSelectedRole(role.id)}
              style={{ borderColor: selectedRole === role.id ? role.color : '#ddd' }}
            >
              <div className="role-icon" style={{ color: role.color }}>
                {role.icon}
              </div>
              <h3>{role.name}</h3>
              <p>{role.description}</p>
            </div>
          ))}
        </div>

        <button
          className="btn-login"
          onClick={handleLogin}
          disabled={!selectedRole}
          style={{ 
            background: selectedRole 
              ? roles.find(r => r.id === selectedRole)?.color 
              : '#ccc' 
          }}
        >
          {selectedRole ? '🔓 ĐĂNG NHẬP' : '⚠️ Vui lòng chọn vai trò'}
        </button>

        <div className="login-footer">
          <small>Demo System - Restaurant Management</small>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
