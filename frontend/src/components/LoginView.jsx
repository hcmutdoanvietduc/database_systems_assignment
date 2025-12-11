import React, { useState } from 'react';
import { login } from '../api';
import './LoginView.css';

function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      const { access, refresh, role, username: returnedUsername } = res.data;

      // Store in localStorage
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userRole', role);
      localStorage.setItem('username', returnedUsername);

      // Notify App component
      onLogin(role, returnedUsername);
    } catch (err) {
      console.error(err);
      setError('Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <h1>Đăng Nhập</h1>
          <p>Hệ thống quản lý nhà hàng</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Tên đăng nhập (VD: sManager)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              required
            />
          </div>

          {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ background: '#667eea' }}
          >
            {loading ? '⏳ Đang xử lý...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <button 
            type="button" 
            onClick={() => {
              localStorage.setItem('userRole', 'Customer');
              localStorage.setItem('username', 'Khách hàng');
              onLogin('Customer', 'Khách hàng');
            }}
            style={{ 
              width: '100%', 
              padding: '12px',  
              borderRadius: '8px', 
              border: '2px solid #667eea', 
              background: 'white', 
              color: '#667eea', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Khách hàng (Không cần đăng nhập)
          </button>
        </div>
        
        <div className="login-footer">
          <small>Default: sManager / 123456</small>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
