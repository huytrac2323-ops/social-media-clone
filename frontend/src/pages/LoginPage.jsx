import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;




function LoginPage() {
  // 👈 Đổi state từ email thành username
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
          } catch (error) {
            setError(error.message);
          }
        }
      });
      window.google.accounts.id.renderButton(document.getElementById('google-login-button'), {
        theme: 'outline',
        size: 'large',
        width: 280,
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
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook chưa tải xong, vui lòng thử lại.');
      return;
    }
    window.FB.login(async response => {
      if (!response.authResponse?.accessToken) {
        setError('Bạn đã hủy đăng nhập Facebook.');
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
    }, { scope: 'public_profile,email' });
  };

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
          <div id="google-login-button" style={{ margin: '14px auto' }} />
          {FACEBOOK_APP_ID && <button type="button" className="auth-button facebook-auth-button" onClick={handleFacebookLogin}>Đăng nhập bằng Facebook</button>}
          <p><Link to="/forgot-password">Quên mật khẩu?</Link></p>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="switch-auth-box">
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        </div>
      </div>
  );
}

export default LoginPage;