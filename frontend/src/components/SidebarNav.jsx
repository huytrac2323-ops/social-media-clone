import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import Avatar from './Avatar.jsx';
import {
    Home,
    Compass,
    Bookmark,
    User,
    PlusCircle,
    LogOut,
    LogIn,
    Search,
    Globe,
    MessageCircle
} from 'lucide-react';

function SidebarNav({ onCreatePost }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');

    const currentUsername = (currentUser?.username && currentUser.username !== 'null' && currentUser.username !== 'undefined')
        ? currentUser.username
        : (currentUser?.user?.username && currentUser.user.username !== 'null' && currentUser.user.username !== 'undefined')
            ? currentUser.user.username
            : (currentUser?.user_id || currentUser?.id || '');

    const profilePath = currentUser
        ? (currentUsername ? `/profile/${encodeURIComponent(currentUsername)}` : `/profile/${currentUser.user_id || currentUser.id || ''}`)
        : '/login';

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
        <>
            {/* ============================================== */}
            {/* MOBILE TOP HEADER (< 768px)                    */}
            {/* ============================================== */}
            <header className="mobile-top-header">
                <Link to="/" className="mobile-header-logo" title="Trang chủ">
                    <div className="brand-logo-icon" style={{ width: '32px', height: '32px' }}>
                        <Globe size={18} />
                    </div>
                    <span className="brand-logo-text" style={{ fontSize: '18px' }}>SocialHub</span>
                </Link>

                <div className="mobile-header-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/explore')}
                        className="mobile-header-icon-btn"
                        title="Tìm kiếm"
                        aria-label="Tìm kiếm"
                    >
                        <Search size={18} />
                    </button>
                    <NotificationDropdown compact={true} />
                </div>
            </header>

            {/* ============================================== */}
            {/* DESKTOP / TABLET SIDEBAR (≥ 768px)             */}
            {/* ============================================== */}
            <aside className="app-sidebar-col" aria-label="Điều hướng chính">
                <nav className="modern-sidebar">
                    {/* Brand Logo */}
                    <Link to="/" className="brand-logo-container" title="Trang chủ">
                        <div className="brand-logo-icon">
                            <Globe size={20} />
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
                                    <Link to="/messages" className={`nav-link-item ${isActive('/messages') ? 'active' : ''}`} title="Tin nhắn">
                                        <MessageCircle size={20} />
                                        <span>Tin nhắn</span>
                                    </Link>
                                </li>
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
                                        to={profilePath}
                                        className={`nav-link-item ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
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
                            <Link to={profilePath} className="sidebar-user-info" title="Xem hồ sơ">
                                <Avatar user={currentUser} size={36} />
                                <div className="sidebar-user-meta">
                                    <div className="sidebar-user-name">{currentUser.username || currentUser.full_name || 'Người dùng'}</div>
                                    <div className="sidebar-user-role">@{currentUser.username || 'user'}</div>
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

            {/* ============================================== */}
            {/* MOBILE BOTTOM NAVIGATION (< 768px)             */}
            {/* ============================================== */}
            <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
                <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`} title="Trang chủ">
                    <Home size={22} />
                    <span>Trang chủ</span>
                </Link>

                <Link to="/explore" className={`mobile-nav-item ${isActive('/explore') ? 'active' : ''}`} title="Tìm kiếm">
                    <Search size={22} />
                    <span>Tìm kiếm</span>
                </Link>

                {currentUser ? (
                    <>
                        <button
                            type="button"
                            className="mobile-nav-item mobile-nav-create-btn"
                            onClick={onCreatePost}
                            title="Tạo bài viết"
                            aria-label="Tạo bài viết"
                        >
                            <div className="mobile-create-icon-wrap">
                                <PlusCircle size={22} />
                            </div>
                        </button>

                        <Link
                            to="/messages"
                            className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`}
                            title="Tin nhắn"
                        >
                            <MessageCircle size={22} />
                            <span>Tin nhắn</span>
                        </Link>

                        <Link
                            to={profilePath}
                            className={`mobile-nav-item ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
                            title="Trang cá nhân"
                        >
                            <Avatar user={currentUser} size={24} />
                            <span>Cá nhân</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            to="/messages"
                            className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`}
                            title="Tin nhắn"
                        >
                            <MessageCircle size={22} />
                            <span>Tin nhắn</span>
                        </Link>
                        <Link to="/login" className={`mobile-nav-item ${isActive('/login') ? 'active' : ''}`} title="Đăng nhập">
                            <LogIn size={22} />
                            <span>Đăng nhập</span>
                        </Link>
                    </>
                )}
            </nav>
        </>
    );
}

export default SidebarNav;
