import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;



function LoginPage() {
  // 👈 Đổi state từ email thành username
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 👈 Gửi username lên server
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');

      if (data.token) localStorage.setItem('token', data.token);
      login(data.user || data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-logo">Facebook</h1>
          <form onSubmit={handleSubmit}>
            {/* 👈 Đổi type thành "text" và cập nhật ô nhập */}
            <input
                type="text"
                placeholder="Tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit" className="auth-button">Đăng nhập</button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="switch-auth-box">
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        </div>
      </div>
  );
}

export default LoginPage;