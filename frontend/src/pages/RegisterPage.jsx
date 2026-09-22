import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext.jsx';
import { Globe, Mail, User, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

const CREATOR_TYPES = [
  { value: null,           emoji: '👤', label: 'Người dùng thường',     desc: 'Tôi muốn xem và tương tác' },
  { value: 'illustrator',  emoji: '🎨', label: 'Họa sĩ / Minh họa',     desc: 'Vẽ tranh, digital art, fanart' },
  { value: 'photographer', emoji: '📸', label: 'Nhiếp ảnh gia',          desc: 'Chụp ảnh phong cảnh, chân dung' },
  { value: 'musician',     emoji: '🎵', label: 'Nhạc sĩ / Ca sĩ',       desc: 'Sáng tác, cover, biểu diễn' },
  { value: 'videographer', emoji: '🎬', label: 'Làm phim / Video',       desc: 'YouTuber, TikToker, editor' },
  { value: 'writer',       emoji: '✍️',  label: 'Nhà văn / Copywriter',  desc: 'Viết truyện, blog, nội dung' },
  { value: 'dancer',       emoji: '💃', label: 'Vũ công / Biên đạo',    desc: 'Nhảy cover, biên đạo múa' },
  { value: 'designer',     emoji: '🖥️', label: 'Thiết kế đồ họa',       desc: 'UI/UX, logo, poster, brand' },
  { value: 'gamer',        emoji: '🎮', label: 'Game Creator',            desc: 'Streamer, game developer, review' },
  { value: 'crafter',      emoji: '🧶', label: 'Thủ công / DIY',         desc: 'Handmade, decor, trang sức' },
];

function RegisterPage({ onRegisterSuccess }) {
  const [step, setStep]               = useState(1); // 1 = info form, 2 = chọn loại
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [creatorType, setCreatorType] = useState(null); // null = người dùng thường
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);
  const navigate                      = useNavigate();
  const { login }                     = useAuth();

  const handleNext = (e) => {
    e.preventDefault();
    if (!username || !email || !password) { setError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, creator_type: creatorType }),
      });
      const newUser = await response.json();
      if (!response.ok) throw new Error(newUser.message || 'Đăng ký thất bại.');

      setSuccess('Đăng ký thành công! Đang đăng nhập...');

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginData.message || 'Lỗi đăng nhập.');

      if (loginData.token) localStorage.setItem('token', loginData.token);
      login(loginData.user || loginData);
      if (onRegisterSuccess) onRegisterSuccess();
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: step === 2 ? '560px' : '420px', transition: 'max-width 0.3s ease' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <img src="/novagen-icon.jpg" alt="NovaGen" style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }} />
        </div>

        {/* ============ BƯỚC 1: Nhập thông tin ============ */}
        {step === 1 && (
          <>
            <h1 className="auth-logo" style={{ background: 'linear-gradient(135deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NovaGen</h1>
            <p className="auth-subtitle">Tạo tài khoản để tham gia cộng đồng sáng tạo</p>

            <form onSubmit={handleNext}>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Mail size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" placeholder="Địa chỉ email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '42px', width: '100%' }} required
                />
              </div>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <User size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text" placeholder="Tên người dùng (username)"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '42px', width: '100%' }} required
                />
              </div>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Lock size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px', width: '100%' }} required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="auth-button">
                Tiếp theo →
              </button>
            </form>
          </>
        )}

        {/* ============ BƯỚC 2: Chọn loại nhà sáng tạo ============ */}
        {step === 2 && (
          <>
            <h1 className="auth-logo" style={{ fontSize: '22px' }}>Bạn là ai trên NovaGen? 🎯</h1>
            <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
              Chọn ngành sáng tạo của bạn để được kết nối với đúng cộng đồng.<br />
              <span style={{ fontSize: '12px', opacity: 0.6 }}>Bạn có thể thay đổi sau trong trang cá nhân.</span>
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '24px',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {CREATOR_TYPES.map(({ value, emoji, label, desc }) => {
                const isSelected = creatorType === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setCreatorType(value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      padding: '14px',
                      borderRadius: '14px',
                      border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{emoji}</span>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#60a5fa' : 'var(--text-primary)' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {desc}
                    </span>
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '8px', right: '8px',
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: 'white'
                      }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: '0 0 auto',
                  padding: '13px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Quay lại
              </button>
              <button
                type="button"
                className="auth-button"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Đang tạo tài khoản...' : (creatorType ? '🚀 Bắt đầu sáng tạo!' : 'Tham gia ngay')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="switch-auth-box">
        <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;