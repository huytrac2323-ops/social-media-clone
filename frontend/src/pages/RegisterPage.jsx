import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext.jsx';
import { Globe, Mail, User, Lock, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';



function RegisterPage({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

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
        // 👈 Thay chữ email thành username để đồng bộ
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginData.message || "Lỗi khi tự động đăng nhập.");

// Lưu token vào trình duyệt để các API fetch sau này hoạt động được
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
      }

// 👈 Chỉ truyền đúng object user vào context
      login(loginData.user || loginData);

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Globe size={26} />
          </div>
        </div>

        <h1 className="auth-logo">SocialHub</h1>
        <p className="auth-subtitle">Đăng ký để khám phá và chia sẻ ảnh, câu chuyện từ bạn bè</p>

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Địa chỉ email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="text" placeholder="Tên người dùng" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="auth-button">Đăng ký</button>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="email"
              placeholder="Địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '42px', width: '100%' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Tên người dùng"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ paddingLeft: '42px', width: '100%' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '42px', width: '100%' }}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Đang khởi tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      <div className="switch-auth-box">
        <p>Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;