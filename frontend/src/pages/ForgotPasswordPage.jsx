import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [resetMode, setResetMode] = useState(false);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const submit = async event => {
        event.preventDefault();
        setError('');
        setMessage('');
        const endpoint = resetMode ? '/auth/reset-password' : '/auth/forgot-password';
        const body = resetMode ? { token, password } : { email };
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Có lỗi xảy ra.');
            setMessage(data.message);
            if (!token) setEmail('');
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-logo">Khôi phục mật khẩu</h1>
                {!resetMode ? (
                    <form onSubmit={submit}>
                        <input type="email" placeholder="Email tài khoản" value={email} onChange={e => setEmail(e.target.value)} required />
                        <button className="auth-button" type="submit">Gửi mã khôi phục</button>
                    </form>
                ) : (
                    <form onSubmit={submit}>
                        <input type="text" placeholder="Mã khôi phục" value={token} onChange={e => setToken(e.target.value)} required />
                        <input type="password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
                        <button className="auth-button" type="submit">Đổi mật khẩu</button>
                    </form>
                )}
                <button type="button" className="auth-link-button" onClick={() => setResetMode(value => !value)}>
                    {resetMode ? 'Quay lại yêu cầu mã' : 'Tôi đã có mã khôi phục'}
                </button>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <p><Link to="/login">Quay lại đăng nhập</Link></p>
            </div>
        </div>
    );
}
