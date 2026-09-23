import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import CreativeJobsModal from '../modals/CreativeJobsModal.jsx';
import { safeFetch } from '../utils/api';
import {
  Sparkles,
  Newspaper,
  Briefcase,
  Search,
  Plus,
  MessageCircle,
  ShieldCheck,
  Bookmark,
  Sun,
  Moon,
  LogOut,
  LogIn,
  User,
  X,
  ChevronDown
} from 'lucide-react';

export default function AppHeader({
  onCreatePost,
  onSearch,
  allUsers = [],
  friendUserIds = new Set()
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('theme') || localStorage.getItem('novagen_theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const profileMenuRef = useRef(null);

  // Click outside để đóng menu profile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đồng bộ theme với documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Lắng nghe thay đổi theme từ trình duyệt hệ thống nếu người dùng chưa đặt thủ công
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (e) => {
      const stored = localStorage.getItem('theme') || localStorage.getItem('novagen_theme');
      if (!stored) {
        const sysTheme = e.matches ? 'light' : 'dark';
        setTheme(sysTheme);
        document.documentElement.setAttribute('data-theme', sysTheme);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
      localStorage.setItem('novagen_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch {}
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onSearch) {
      onSearch(searchQuery.trim());
    } else {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentUsername = currentUser?.username || currentUser?.user?.username || '';
  const profilePath = currentUsername ? `/profile/${encodeURIComponent(currentUsername)}` : '/profile';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.user?.role === 'admin';

  return (
    <>
      <header className="behance-global-header">
        <div className="behance-header-left">
          {/* LOGO NOVAGEN */}
          <Link to="/" className="behance-brand-logo" title="NovaGen Creator Network">
            <img
              src="/novagen-icon.jpg"
              alt="NovaGen"
              className="behance-logo-img"
            />
            <span className="behance-logo-text">NovaGen</span>
          </Link>

          {/* CÁC TAB ĐIỀU HƯỚNG CHÍNH */}
          <nav className="behance-nav-links">
            <Link
              to="/"
              className={`behance-nav-item ${(location.pathname === '/' || location.pathname === '/explore') && new URLSearchParams(location.search).get('tab') !== 'collaborations' ? 'active' : ''}`}
            >
              <Sparkles size={16} />
              <span>Explore</span>
            </Link>

            <Link
              to="/feed"
              className={`behance-nav-item ${location.pathname === '/feed' ? 'active' : ''}`}
            >
              <Newspaper size={16} />
              <span>Bảng tin Bài viết</span>
            </Link>

            <Link
              to="/?tab=collaborations"
              className={`behance-nav-item ${(location.pathname === '/' || location.pathname === '/explore') && new URLSearchParams(location.search).get('tab') === 'collaborations' ? 'active' : ''}`}
            >
              <Briefcase size={16} />
              <span>Tìm & Hợp tác NST</span>
              <span className="jobs-pill-hot">HOT</span>
            </Link>
          </nav>
        </div>

        {/* Ô TÌM KIẾM TRUNG TÂM CHUẨN BEHANCE */}
        <div className="behance-header-center">
          <form className="behance-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={16} className="behance-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tác phẩm, dự án, designer, #UI/UX..."
              className="behance-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="behance-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>

        {/* CÁC TIỆN ÍCH BÊN PHẢI */}
        <div className="behance-header-right">
          {/* NÚT TẠO BÀI VIẾT / ĐĂNG DỰ ÁN */}
          {currentUser && (
            <button
              type="button"
              className="btn-header-create-post"
              onClick={onCreatePost}
              title="Đăng dự án hoặc chia sẻ trạng thái"
              style={{ whiteSpace: 'nowrap', flexShrink: 0, height: '38px', minWidth: 'fit-content' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span style={{ whiteSpace: 'nowrap' }}>Tạo tác phẩm</span>
            </button>
          )}

          {/* THÔNG BÁO HỆ THỐNG */}
          <NotificationDropdown compact={true} />

          {/* TIN NHẮN / CHAT */}
          {currentUser && (
            <Link
              to="/messages"
              className={`header-icon-btn ${location.pathname.startsWith('/messages') ? 'active' : ''}`}
              title="Tin nhắn"
              aria-label="Tin nhắn"
            >
              <MessageCircle size={19} />
            </Link>
          )}

          {/* TRANG QUẢN TRỊ (ADMIN) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="header-admin-pill"
              title="Quản trị hệ thống"
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </Link>
          )}

          {/* USER AVATAR & MENU DROPDOWN */}
          {currentUser ? (
            <div className="header-dropdown-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="header-avatar-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Menu cá nhân"
              >
                <Avatar user={currentUser} size={36} />
              </button>

              {showProfileMenu && (
                <div className="header-popover-menu profile-popover">
                  <div className="profile-popover-header">
                    <Avatar user={currentUser} size={42} />
                    <div className="profile-popover-user">
                      <strong className="profile-popover-username">{currentUser.username}</strong>
                      <span className="profile-popover-email">{currentUser.email || 'Thành viên NovaGen'}</span>
                    </div>
                  </div>

                  <div className="profile-popover-divider" />

                  <Link
                    to={profilePath}
                    className="profile-popover-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={16} />
                    <span>Trang cá nhân của bạn</span>
                  </Link>

                  <Link
                    to="/saved-posts"
                    className="profile-popover-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Bookmark size={16} />
                    <span>Bộ sưu tập đã lưu</span>
                  </Link>

                  <button
                    type="button"
                    className="profile-popover-item"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span>Chế độ: {theme === 'dark' ? 'Sáng (Light)' : 'Tối (Dark)'}</span>
                  </button>

                  <div className="profile-popover-divider" />

                  <button
                    type="button"
                    className="profile-popover-item danger"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header-auth-actions">
              <Link to="/login" className="btn-header-login">
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </Link>
              <Link to="/register" className="btn-header-register">
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* MODAL CƠ HỘI VIỆC LÀM & DỰ ÁN */}
      {showJobsModal && (
        <CreativeJobsModal onClose={() => setShowJobsModal(false)} />
      )}
    </>
  );
}
