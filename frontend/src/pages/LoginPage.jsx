import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Auth.css';
import { Sparkles, User, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async response => {
          try {
            const result = await fetch(`${API_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential })
            });
            const data = await result.json();
            if (!result.ok) throw new Error(data.message || 'Đăng nhập Google thất bại.');
            localStorage.setItem('token', data.token);
            login(data.user);
            navigate('/');
          } catch (err) {
            setError(err.message);
          }
        }
      });
      window.google.accounts.id.renderButton(document.getElementById('google-login-button'), {
        theme: 'filled_black',
        size: 'large',
        width: 316,
        text: 'signin_with'
      });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [login, navigate]);

  useEffect(() => {
    if (!FACEBOOK_APP_ID) return undefined;
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: true, version: 'v21.0' });
      setFacebookReady(true);
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onerror = () => setError('Không thể tải Facebook Login. Hãy tắt trình chặn quảng cáo rồi thử lại.');
    return () => script.remove();
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook chưa tải xong, vui lòng thử lại.');
      return;
    }
    window.FB.login(async response => {
      if (!response.authResponse?.accessToken) {
       const status = response?.status;
       if (status === 'not_authorized') {
         setError('Facebook chưa cấp quyền cho ứng dụng. Hãy bấm Tiếp tục và cho phép email, hồ sơ công khai.');
       } else if (status === 'unknown') {
         setError('Facebook không mở được cửa sổ đăng nhập. Hãy cho phép popup cho social-media-frontend-brxn.onrender.com và thử lại.');
       } else {
         setError('Đăng nhập Facebook bị đóng hoặc bị trình duyệt chặn popup.');
       }
       return;
      }
      try {
        const result = await fetch(`${API_URL}/auth/facebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: response.authResponse.accessToken })
        });
        const data = await result.json();
        if (!result.ok) throw new Error(data.message || 'Đăng nhập Facebook thất bại.');
        localStorage.setItem('token', data.token);
        login(data.user);
        navigate('/');
      } catch (requestError) {
        setError(requestError.message);
      }
    }, { scope: 'public_profile', auth_type: 'rerequest', return_scopes: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');

      if (data.token) localStorage.setItem('token', data.token);
      login(data.user || data, data.token);
      navigate('/');
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
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
          }}>
            <Sparkles size={26} />
          </div>
        </div>

        <h1 className="auth-logo">SocialHub</h1>
        <p className="auth-subtitle">Kết nối và chia sẻ những khoảnh khắc tuyệt vời cùng bạn bè</p>

        <form onSubmit={handleSubmit}>
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
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div id="google-login-button" style={{ margin: '18px auto 8px auto', display: 'flex', justifyContent: 'center' }} />

        {FACEBOOK_APP_ID && (
          <button
            type="button"
            className="auth-button"
            onClick={handleFacebookLogin}
            disabled={!facebookReady}
            style={{ background: '#1877f2', marginTop: '8px' }}
          >
            {facebookReady ? 'Đăng nhập bằng Facebook' : 'Đang tải Facebook...'}
          </button>
        )}

        <p style={{ marginTop: '16px', fontSize: '13px' }}>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </p>

        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="switch-auth-box">
        <p>Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;