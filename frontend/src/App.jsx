import React, { useState } from 'react';
import './App.css';
import LoginView from './components/LoginView';
import CustomerView from './components/CustomerView';
import StaffView from './components/StaffView';
import AdminView from './components/AdminView';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [currentView, setCurrentView] = useState('main');

  const handleLogin = (role) => {
    setUserRole(role);
    setCurrentView('main');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('main');
  };

  // Nếu chưa đăng nhập, hiện màn hình login
  if (!userRole) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Định nghĩa menu theo role
  const getMenuItems = () => {
    switch (userRole) {
      case 'customer':
        return [
          { id: 'main', icon: '🍽️', label: 'Đặt Món' }
        ];
      case 'staff':
        return [
          { id: 'main', icon: '📋', label: 'Quản Lý Đơn Hàng' }
        ];
      case 'admin':
        return [
          { id: 'main', icon: '📊', label: 'Tổng Quan' }
        ];
      default:
        return [];
    }
  };

  const getRoleName = () => {
    switch (userRole) {
      case 'customer': return 'Khách Hàng';
      case 'staff': return 'Nhân Viên';
      case 'admin': return 'Quản Lý';
      default: return 'User';
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="App">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>🍽️ NHÀ HÀNG VIỆT</h2>
        
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            {item.icon} {item.label}
          </div>
        ))}
        
        <div className="user-info">
          Xin chào, <b>{getRoleName()}</b><br />
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
            {userRole === 'customer' && 'Khách hàng'}
            {userRole === 'staff' && 'Nhân viên phục vụ'}
            {userRole === 'admin' && 'Quản lý hệ thống'}
          </span><br />
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            Đăng xuất
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-wrapper">
        <div className="section active">
          {userRole === 'customer' && <CustomerView />}
          {userRole === 'staff' && <StaffView />}
          {userRole === 'admin' && <AdminView />}
        </div>
      </div>
    </div>
  );
}

export default App;
