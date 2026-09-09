import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import Avatar from './Avatar.jsx';
import { Home, Compass, Bookmark, User, PlusCircle, LogOut, LogIn, Search, Sparkles } from 'lucide-react';

function SidebarNav({ onCreatePost }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');

    const submitSearch = (event) => {
        event.preventDefault();
        if (!query.trim()) return;
        navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="app-sidebar-col" aria-label="Điều hướng chính">
            <nav className="modern-sidebar">
                {/* Brand Logo */}
                <Link to="/" className="brand-logo-container" title="Trang chủ">
                    <div className="brand-logo-icon">
                        <Sparkles size={20} />
                    </div>
                    <span className="brand-logo-text">SocialHub</span>
                </Link>

                {/* Quick Search */}
                <form className="sidebar-search-box" onSubmit={submitSearch}>
                    <Search size={16} className="search-icon" />
                    <input
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="Tìm kiếm..."
                        aria-label="Tìm kiếm"
                    />
                </form>

                {/* Nav Links */}
                <ul className="nav-links-list">
                    <li>
                        <Link to="/" className={`nav-link-item ${isActive('/') ? 'active' : ''}`} title="Trang chủ">
                            <Home size={20} />
                            <span>Trang chủ</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/explore" className={`nav-link-item ${isActive('/explore') ? 'active' : ''}`} title="Khám phá">
                            <Compass size={20} />
                            <span>Khám phá</span>
                        </Link>
                    </li>
                    <li>
                        <NotificationDropdown />
                    </li>

                    {currentUser ? (
                        <>
                            <li>
                                <Link
                                    to="/saved-posts"
                                    className={`nav-link-item ${isActive('/saved-posts') ? 'active' : ''}`}
                                    title="Đã lưu"
                                >
                                    <Bookmark size={20} />
                                    <span>Đã lưu</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={`/profile/${currentUser.username}`}
                                    className={`nav-link-item ${isActive(`/profile/${currentUser.username}`) ? 'active' : ''}`}
                                    title="Trang cá nhân"
                                >
                                    <User size={20} />
                                    <span>Trang cá nhân</span>
                                </Link>
                            </li>

                            <li style={{ marginTop: '10px' }}>
                                <button type="button" className="sidebar-post-btn" onClick={onCreatePost} title="Đăng bài">
                                    <PlusCircle size={18} />
                                    <span>Tạo bài viết</span>
                                </button>
                            </li>
                        </>
                    ) : (
                        <li>
                            <Link to="/login" className={`nav-link-item ${isActive('/login') ? 'active' : ''}`} title="Đăng nhập">
                                <LogIn size={20} />
                                <span>Đăng nhập</span>
                            </Link>
                        </li>
                    )}
                </ul>

                {/* Current User Card in Sidebar Footer */}
                {currentUser && (
                    <div className="sidebar-user-footer">
                        <Link to={`/profile/${currentUser.username}`} className="sidebar-user-info" title="Xem hồ sơ">
                            <Avatar user={currentUser} size={36} />
                            <div className="sidebar-user-meta">
                                <div className="sidebar-user-name">{currentUser.username}</div>
                                <div className="sidebar-user-role">@{currentUser.username}</div>
                            </div>
                        </Link>
                        <button
                            type="button"
                            className="sidebar-logout-btn"
                            onClick={handleLogout}
                            title="Đăng xuất"
                            aria-label="Đăng xuất"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </nav>
        </aside>
    );
}

export default SidebarNav;
