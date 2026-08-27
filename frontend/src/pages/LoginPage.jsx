 import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function LoginPage() { // Bỏ prop setCurrentUser
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Lấy hàm login từ context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {

        throw new Error(data.message || 'Đăng nhập thất bại.');
      }
      // NẾU THÀNH CÔNG SẼ CHẠY XUỐNG DƯỚI NÀY:
      // 1. Lưu thông tin user (Chỉ lấy đúng phần 'user' trong 'data' thôi)
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // 2. Lưu Token
      localStorage.setItem('token', data.token);

      // 3. Truyền ĐÚNG phần user vào hàm login (Lúc trước bạn để là login(data) nên bị lỗi)
      login(data.user);
      navigate('/');

    } catch (err) {
      setError(err.message);
      console.error("Lỗi đăng nhập chi tiết:", err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Facebook</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <p>Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;