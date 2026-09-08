import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

function SidebarNav({ onCreatePost }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const submitSearch = (event) => {
        event.preventDefault();
        navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="home-left-sidebar" aria-label="Điều hướng chính">
            <form className="sidebar-search" onSubmit={submitSearch}>
                <span className="sidebar-search-icon">🔎</span>
                <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Tìm kiếm"
                    aria-label="Tìm kiếm"
                />
            </form>

            <Link to="/explore" className="sidebar-box mobile-only-btn" title="Khám phá">
                <h3>🧭<span>Khám phá</span></h3>
            </Link>
            <Link to="/" className="sidebar-box mobile-only-btn" title="Trang chủ">
                <h3>🏠<span>Trang chủ</span></h3>
            </Link>
            <div className="sidebar-box mobile-only-btn sidebar-notification" title="Thông báo">
                <NotificationDropdown />
                <span className="sidebar-label">Thông báo</span>
            </div>

            {currentUser ? (
                <>
                    <Link to={`/profile/${currentUser.username}`} className="sidebar-box mobile-only-btn" title="Trang cá nhân">
                        <h3>👤<span>{currentUser.username}</span></h3>
                    </Link>
                    <button type="button" className="sidebar-box mobile-only-btn" onClick={onCreatePost} title="Đăng bài">
                        <h3>✍️<span>Đăng bài</span></h3>
                    </button>
                    <button type="button" className="sidebar-box mobile-only-btn sidebar-logout" onClick={handleLogout} title="Đăng xuất">
                        <h3>🚪<span>Đăng xuất</span></h3>
                    </button>
                </>
            ) : (
                <Link to="/login" className="sidebar-box mobile-only-btn" title="Đăng nhập">
                    <h3>🔑<span>Đăng nhập</span></h3>
                </Link>
            )}
        </nav>
    );
}

export default SidebarNav;
