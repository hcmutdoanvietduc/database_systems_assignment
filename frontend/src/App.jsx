import React, { useState, useEffect } from 'react';
import './App.css';
import LoginView from './components/LoginView';
import CustomerView from './components/CustomerView';
import StaffView from './components/StaffView';
import AdminView from './components/AdminView';
import MaterialManagement from './components/MaterialManagement';
import StaffManagement from './components/StaffManagement';
import CustomerManagement from './components/CustomerManagement';
import { logout } from './api';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [currentView, setCurrentView] = useState('main');

  // Effect to restore session
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const storedUsername = localStorage.getItem('username');
    if (role) {
      setUserRole(role);
      if (storedUsername) setUsername(storedUsername);
      
      // Redirect logic based on role
      if (role === 'Manager') setCurrentView('admin');
      else if (role === 'Staff') setCurrentView('staff');
      else if (role === 'Customer') setCurrentView('customer');
    }
  }, []);

  const handleLogin = (role, name) => {
    setUserRole(role);
    setUsername(name);
    // Redirect logic
    if (role === 'Manager') setCurrentView('admin');
    else if (role === 'Staff') setCurrentView('staff');
    else if (role === 'Customer') setCurrentView('customer');
    else setCurrentView('main');
  };

  const handleLogout = () => {
    logout(); // Clears storage and reloads
  };

  // Nếu chưa đăng nhập, hiện màn hình login
  if (!userRole) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Định nghĩa menu theo role
  const getMenuItems = () => {
    switch (userRole) {
      case 'Manager':
        return [
          { id: 'admin', label: 'Tổng Quan' },
          { id: 'materials', label: 'Nguyên Liệu' },
          { id: 'staff-management', label: 'Quản Lý NV' },
          { id: 'customers', label: 'Khách Hàng' }
        ];
      case 'Staff':
        return [
          { id: 'staff', label: 'Quản Lý Đơn Hàng' }
        ];
      case 'Customer':
        return [
          { id: 'customer', label: 'Đặt Món' }
        ];
      default:
        return [];
    }
  };

  const getRoleName = () => {
    switch (userRole) {
      case 'Manager': return 'Quản Lý';
      case 'Staff': return 'Nhân Viên';
      case 'Customer': return 'Khách Hàng';
      default: return 'User';
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="App">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>NHÀ HÀNG VIỆT</h2>
        
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            {item.label}
          </div>
        ))}
        
        <div className="user-info">
          Xin chào, <b>{username || getRoleName()}</b><br />
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
            {userRole === 'Manager' && 'Quản lý hệ thống'}
            {userRole === 'Staff' && 'Nhân viên phục vụ'}
          </span><br />
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            Đăng xuất
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-wrapper">
        <div className="section active">
          {userRole === 'Manager' && currentView === 'admin' && <AdminView />}
          {userRole === 'Manager' && currentView === 'materials' && <MaterialManagement />}
          {userRole === 'Manager' && currentView === 'staff-management' && <StaffManagement />}
          {userRole === 'Manager' && currentView === 'customers' && <CustomerManagement />}
          {userRole === 'Staff' && <StaffView />}
          {userRole === 'Customer' && <CustomerView />}
        </div>
      </div>
    </div>
  );
}

export default App;
