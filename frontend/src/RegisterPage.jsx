import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from './AuthContext'; // Import useAuth

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function RegisterPage({ onRegisterSuccess }) { // Bỏ setCurrentUser
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Lấy hàm login từ context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const newUser = await response.json();

      if (!response.ok) {
        throw new Error(newUser.message || 'Đăng ký thất bại.');
      }

      setSuccess('Đăng ký thành công! Đang tự động đăng nhập...');
      
      // Tự động đăng nhập người dùng mới
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json();
      if(!loginResponse.ok) throw new Error(loginData.message || "Lỗi khi tự động đăng nhập.");

      login(loginData); // Sử dụng hàm login từ context

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Facebook</h1>
        <p className="auth-subtitle">Đăng ký để xem ảnh và video từ bạn bè.</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Địa chỉ email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="text" placeholder="Tên người dùng" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="auth-button">Đăng ký</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
      <div className="switch-auth-box">
        <p>Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;