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
    MessageCircle,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Crown,
    Sparkles
} from 'lucide-react';

function SidebarNav({ onCreatePost }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');

    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
            return next;
        });
    };

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

    const isAdmin = currentUser?.role === 'admin' || currentUser?.user?.role === 'admin';

    return (
        <>
            {/* ============================================== */}
            {/* MOBILE TOP HEADER (< 768px)                    */}
            {/* ============================================== */}
            <header className="mobile-top-header">
                <Link to="/" className="mobile-header-logo" title="Trang chủ">
                    <img src="/novagen-icon.jpg" alt="NovaGen" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                    <span className="brand-logo-text" style={{ fontSize: '18px', background: 'linear-gradient(135deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>NovaGen</span>
                </Link>

                <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            title="Trang quản trị"
                            aria-label="Trang quản trị"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: 'rgba(236, 72, 153, 0.15)',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                color: '#f472b6',
                                fontSize: '11px',
                                fontWeight: '700',
                                textDecoration: 'none'
                            }}
                        >
                            <ShieldCheck size={12} color="#ec4899" />
                            <span>Admin</span>
                        </Link>
                    )}
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
            <aside className={`app-sidebar-col ${isCollapsed ? 'collapsed' : ''}`} aria-label="Điều hướng chính">
                <nav className="modern-sidebar">
                    {/* Brand Logo & Collapse Toggle */}
                    <div className="sidebar-brand-header">
                        <Link to="/" className="brand-logo-container" title="Trang chủ" style={{ marginBottom: 0 }}>
                            <img
                                src="/novagen-icon.jpg"
                                alt="NovaGen"
                                className="sidebar-brand-img"
                            />
                            {!isCollapsed && (
                                <span className="brand-logo-text" style={{ background: 'linear-gradient(135deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800', fontSize: '19px' }}>NovaGen</span>
                            )}
                        </Link>

                        <button
                            type="button"
                            className="sidebar-collapse-toggle-btn"
                            onClick={toggleCollapse}
                            title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn chỉ hiển thị Icon"}
                            aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    </div>

                    {/* Admin Badge */}
                    {isAdmin && !isCollapsed && (
                        <div style={{ marginBottom: '12px' }}>
                            <Link
                                to="/admin"
                                title="Trang quản trị"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 10px',
                                    borderRadius: '10px',
                                    background: isActive('/admin') ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.12)',
                                    border: '1px solid rgba(236, 72, 153, 0.35)',
                                    color: '#f472b6',
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <ShieldCheck size={13} color="#ec4899" />
                                <span>Quản trị hệ thống</span>
                            </Link>
                        </div>
                    )}

                    {/* Quick Search */}
                    {!isCollapsed && (
                        <form className="sidebar-search-box" onSubmit={submitSearch}>
                            <Search size={16} className="search-icon" />
                            <input
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="Tìm kiếm tác phẩm..."
                                aria-label="Tìm kiếm"
                            />
                        </form>
                    )}

                    {/* Nav Links */}
                    <ul className="nav-links-list">
                        <li>
                            <Link to="/feed" className={`nav-link-item ${isActive('/feed') ? 'active' : ''}`} title="Bảng tin bài viết">
                                <Home size={20} />
                                {!isCollapsed && <span>Trang chủ</span>}
                            </Link>
                        </li>
                        <li>
                            <Link to="/" className={`nav-link-item ${isActive('/') ? 'active' : ''}`} title="Explore">
                                <Compass size={20} />
                                {!isCollapsed && <span>Khám phá</span>}
                            </Link>
                        </li>
                        <li>
                            <NotificationDropdown compact={isCollapsed} />
                        </li>

                        {currentUser ? (
                            <>
                                <li>
                                    <Link to="/messages" className={`nav-link-item ${isActive('/messages') ? 'active' : ''}`} title="Tin nhắn">
                                        <MessageCircle size={20} />
                                        {!isCollapsed && <span>Tin nhắn</span>}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/saved-posts"
                                        className={`nav-link-item ${isActive('/saved-posts') ? 'active' : ''}`}
                                        title="Đã lưu"
                                    >
                                        <Bookmark size={20} />
                                        {!isCollapsed && <span>Đã lưu</span>}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={profilePath}
                                        className={`nav-link-item ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
                                        title="Trang cá nhân"
                                    >
                                        <User size={20} />
                                        {!isCollapsed && <span>Trang cá nhân</span>}
                                    </Link>
                                </li>

                                <li style={{ marginTop: '4px' }}>
                                    <button
                                        type="button"
                                        className={`nav-link-item sidebar-vip-nav-btn ${currentUser?.vip_tier && currentUser?.vip_tier !== 'free' ? 'is-vip' : ''}`}
                                        onClick={() => window.dispatchEvent(new CustomEvent('open-vip-modal'))}
                                        title={currentUser?.vip_tier && currentUser?.vip_tier !== 'free' ? 'Đặc quyền VIP của bạn' : 'Nâng cấp Gói VIP'}
                                    >
                                        <Crown size={20} color={currentUser?.vip_tier === 'pro' ? '#38bdf8' : '#eab308'} />
                                        {!isCollapsed && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <span style={{ fontWeight: 700, color: currentUser?.vip_tier === 'pro' ? '#38bdf8' : '#eab308' }}>
                                                    {currentUser?.vip_tier === 'pro' ? 'VIP Pro' : (currentUser?.vip_tier === 'creator' ? 'VIP Creator' : 'Gói VIP')}
                                                </span>
                                                <span style={{
                                                    fontSize: '9.5px',
                                                    fontWeight: 800,
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    background: currentUser?.vip_tier && currentUser?.vip_tier !== 'free' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                    color: currentUser?.vip_tier && currentUser?.vip_tier !== 'free' ? '#38bdf8' : '#eab308',
                                                    border: '1px solid currentColor',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {currentUser?.vip_tier && currentUser?.vip_tier !== 'free' ? 'Đang bật' : 'MỚI'}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </li>

                                <li style={{ marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        className="sidebar-post-btn"
                                        onClick={onCreatePost}
                                        title="Tạo bài viết / Đăng dự án"
                                    >
                                        <PlusCircle size={18} />
                                        {!isCollapsed && <span>Tạo dự án</span>}
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li>
                                <Link to="/login" className={`nav-link-item ${isActive('/login') ? 'active' : ''}`} title="Đăng nhập">
                                    <LogIn size={20} />
                                    {!isCollapsed && <span>Đăng nhập</span>}
                                </Link>
                            </li>
                        )}
                    </ul>

                    {/* Current User Card in Sidebar Footer */}
                    {currentUser && (
                        <div className="sidebar-user-footer">
                            <Link to={profilePath} className="sidebar-user-info" title="Xem hồ sơ">
                                <Avatar user={currentUser} size={36} />
                                {!isCollapsed && (
                                    <div className="sidebar-user-meta">
                                        <div className="sidebar-user-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>{currentUser.username || currentUser.full_name || 'Người dùng'}</span>
                                            {Boolean(currentUser.is_verified) && (
                                                <svg className="verified-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="#0095f6" aria-label="Đã xác thực">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                </svg>
                                            )}
                                            {(currentUser.vip_tier && currentUser.vip_tier !== 'free') && (
                                                <span title={currentUser.vip_tier === 'pro' ? 'VIP Pro' : 'VIP Creator'} style={{ display: 'inline-flex' }}>
                                                    <Crown size={13} color={currentUser.vip_tier === 'pro' ? '#38bdf8' : '#eab308'} />
                                                </span>
                                            )}
                                        </div>
                                        <div className="sidebar-user-role">@{currentUser.username || 'user'}</div>
                                    </div>
                                )}
                            </Link>
                            {!isCollapsed && (
                                <button
                                    type="button"
                                    className="sidebar-logout-btn"
                                    onClick={handleLogout}
                                    title="Đăng xuất"
                                    aria-label="Đăng xuất"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
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
