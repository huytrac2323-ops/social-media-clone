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
  Users,
  UserPlus,
  UserCheck,
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
  const [showSuggestionsMenu, setShowSuggestionsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const suggestionsRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Tính toán gợi ý kết bạn
  useEffect(() => {
    if (!allUsers || allUsers.length === 0) return;
    const currentId = currentUser?.user_id || currentUser?.id;
    const filtered = allUsers
      .filter(u => {
        const uId = Number(u.user_id || u.id);
        if (currentId && uId === Number(currentId)) return false;
        if (friendUserIds.has(uId)) return false;
        return true;
      })
      .slice(0, 15);
    setSuggestions(filtered);
  }, [allUsers, currentUser, friendUserIds]);

  // Click outside để đóng menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestionsMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
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

  const handleSendFriendRequest = async (targetId, e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const myId = Number(currentUser.user_id || currentUser.id);
    const tId = Number(targetId);
    setSentRequests(prev => new Set(prev).add(tId));
    try {
      const res = await safeFetch('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: myId, addressee_id: tId })
      });
      if (!res.ok) {
        setSentRequests(prev => {
          const next = new Set(prev);
          next.delete(tId);
          return next;
        });
      }
    } catch {
      setSentRequests(prev => {
        const next = new Set(prev);
        next.delete(tId);
        return next;
      });
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
              className={`behance-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Sparkles size={16} />
              <span>Dự án Behance</span>
            </Link>

            <Link
              to="/feed"
              className={`behance-nav-item ${location.pathname === '/feed' ? 'active' : ''}`}
            >
              <Newspaper size={16} />
              <span>Bảng tin Bài viết</span>
            </Link>

            <button
              type="button"
              className="behance-nav-item"
              onClick={() => setShowJobsModal(true)}
            >
              <Briefcase size={16} />
              <span>Cơ hội việc làm</span>
              <span className="jobs-pill-hot">HOT</span>
            </button>
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

        {/* CÁC TIỆN ÍCH BÊN PHẢI (CHUYỂN TỪ SIDEBAR PHẢI LÊN HEADER) */}
        <div className="behance-header-right">
          {/* NÚT TẠO BÀI VIẾT / ĐĂNG DỰ ÁN */}
          {currentUser && (
            <button
              type="button"
              className="btn-header-create-post"
              onClick={onCreatePost}
              title="Đăng dự án hoặc chia sẻ trạng thái"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Tạo tác phẩm</span>
            </button>
          )}

          {/* GỢI Ý KẾT BẠN (DROPDOWN POPOVER) */}
          {currentUser && (
            <div className="header-dropdown-wrap" ref={suggestionsRef}>
              <button
                type="button"
                className={`header-icon-btn ${showSuggestionsMenu ? 'active' : ''}`}
                onClick={() => setShowSuggestionsMenu(!showSuggestionsMenu)}
                title="Gợi ý kết bạn sáng tạo"
                aria-label="Gợi ý kết bạn"
              >
                <Users size={19} />
                {suggestions.length > 0 && (
                  <span className="header-badge-count">{Math.min(suggestions.length, 9)}</span>
                )}
              </button>

              {showSuggestionsMenu && (
                <div className="header-popover-menu suggestions-popover">
                  <div className="popover-header">
                    <span className="popover-title">Gợi ý kết bạn</span>
                    <Link
                      to="/explore"
                      className="popover-link-more"
                      onClick={() => setShowSuggestionsMenu(false)}
                    >
                      Khám phá thêm
                    </Link>
                  </div>

                  <div className="suggestions-popover-list no-scrollbar">
                    {suggestions.length > 0 ? (
                      suggestions.map(user => {
                        const isSent = sentRequests.has(Number(user.user_id || user.id));
                        return (
                          <div key={user.user_id || user.id} className="suggestion-popover-item">
                            <div
                              className="suggestion-popover-meta"
                              onClick={() => {
                                navigate(`/profile/${encodeURIComponent(user.username)}`);
                                setShowSuggestionsMenu(false);
                              }}
                            >
                              <Avatar user={user} size={36} />
                              <div className="suggestion-popover-info">
                                <div className="suggestion-popover-name">
                                  <span>{user.username}</span>
                                  {user.is_verified && (
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="#0095f6">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="suggestion-popover-sub">Nhà sáng tạo</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={`btn-header-add-friend ${isSent ? 'sent' : ''}`}
                              disabled={isSent}
                              onClick={(e) => handleSendFriendRequest(user.user_id || user.id, e)}
                            >
                              {isSent ? (
                                <>
                                  <UserCheck size={12} />
                                  <span>Đã gửi</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={12} />
                                  <span>Kết bạn</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="popover-empty">Không có gợi ý mới lúc này</div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
