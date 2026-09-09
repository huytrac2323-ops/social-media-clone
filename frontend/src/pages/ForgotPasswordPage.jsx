import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';
import { Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [resetMode, setResetMode] = useState(false);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async event => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
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
                        <KeyRound size={24} />
                    </div>
                </div>

                <h1 className="auth-logo" style={{ fontSize: '24px' }}>Khôi phục mật khẩu</h1>
                <p className="auth-subtitle">
                    {resetMode ? 'Nhập mã xác nhận và mật khẩu mới' : 'Nhập địa chỉ email tài khoản để nhận mã khôi phục'}
                </p>

                {!resetMode ? (
                    <form onSubmit={submit}>
                        <input type="email" placeholder="Email tài khoản" value={email} onChange={e => setEmail(e.target.value)} required />
                        <button className="auth-button" type="submit">Gửi mã khôi phục</button>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="email"
                                placeholder="Địa chỉ email đã đăng ký"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ paddingLeft: '42px', width: '100%' }}
                                required
                            />
                        </div>
                        <button className="auth-button" type="submit" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Gửi mã xác nhận'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={submit}>
                        <input type="text" placeholder="Mã khôi phục" value={token} onChange={e => setToken(e.target.value)} required />
                        <input type="password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
                        <button className="auth-button" type="submit">Đổi mật khẩu</button>
                        <div style={{ position: 'relative' }}>
                            <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="Mã khôi phục"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                style={{ paddingLeft: '42px', width: '100%' }}
                                required
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="password"
                                placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                minLength={8}
                                style={{ paddingLeft: '42px', width: '100%' }}
                                required
                            />
                        </div>
                        <button className="auth-button" type="submit" disabled={loading}>
                            {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                )}

                <button type="button" className="auth-link-button" onClick={() => setResetMode(value => !value)}>
                    {resetMode ? 'Quay lại yêu cầu mã' : 'Tôi đã có mã khôi phục'}
                    {resetMode ? 'Quay lại bước gửi mã' : 'Tôi đã có mã khôi phục'}
                </button>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <p><Link to="/login">Quay lại đăng nhập</Link></p>

                <p style={{ marginTop: '18px', fontSize: '13px' }}>
                    <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowLeft size={14} /> Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
