import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import { safeFetch } from '../utils/api';
import {
  Bookmark,
  UserPlus,
  Users,
  LogOut,
  X,
  ArrowLeft,
  Check,
  ChevronRight,
  Trash2,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

function ProfileMenuModal({ isOpen, onClose, onRequestVerification }) {
  const {
    currentUser,
    updateUser,
    savedAccounts,
    switchAccount,
    logout,
    addAccountSession,
    removeSavedAccount
  } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('main'); // 'main' | 'accounts'
  const [togglingCollab, setTogglingCollab] = useState(false);

  const isOpenForCollab = currentUser?.open_for_collab !== false;

  const handleToggleOpenForCollab = async () => {
    if (!currentUser) return;
    setTogglingCollab(true);
    const nextStatus = !isOpenForCollab;
    try {
      const token = window.localStorage.getItem('token');
      const res = await safeFetch('/profile/toggle-open-for-collab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: currentUser.user_id || currentUser.id,
          open_for_collab: nextStatus
        })
      });
      if (res.ok) {
        if (updateUser) {
          updateUser({ open_for_collab: nextStatus });
        }
      }
    } catch (err) {
      console.error('Lỗi đổi trạng thái nhận dự án:', err);
    } finally {
      setTogglingCollab(false);
    }
  };

  if (!isOpen) return null;

  const handleGoSavedPosts = () => {
    onClose();
    navigate('/saved-posts');
  };

  const handleAddAccount = () => {
    addAccountSession();
    onClose();
    navigate('/login');
  };

  const handleSwitch = (userId) => {
    if (Number(userId) === Number(currentUser?.user_id)) {
      onClose();
      return;
    }
    const success = switchAccount(userId);
    if (success) {
      onClose();
      const accounts = savedAccounts || [];
      const target = accounts.find(a => Number(a.user_id) === Number(userId));
      if (target?.username && target.username !== 'null') {
        navigate(`/profile/${encodeURIComponent(target.username)}`);
      } else if (target?.user_id) {
        navigate(`/profile/${target.user_id}`);
      } else {
        window.location.reload();
      }
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="profile-menu-overlay" onClick={onClose}>
      <div
        className="profile-menu-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top drag bar indicator for mobile */}
        <div className="profile-menu-handle-bar" />

        {/* HEADER */}
        <div className="profile-menu-header">
          {view === 'accounts' ? (
            <button
              type="button"
              className="profile-menu-icon-btn"
              onClick={() => setView('main')}
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div style={{ width: '32px' }} />
          )}

          <h3 className="profile-menu-title">
            {view === 'accounts' ? 'Chuyển đổi tài khoản' : 'Cài đặt & Tùy chọn'}
          </h3>

          <button
            type="button"
            className="profile-menu-icon-btn"
            onClick={onClose}
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* VIEW: MAIN MENU */}
        {view === 'main' && (
          <div className="profile-menu-body">
            {/* User overview info */}
            {currentUser && (
              <div className="profile-menu-user-summary">
                <Avatar user={currentUser} size={48} />
                <div style={{ overflow: 'hidden' }}>
                  <div className="profile-menu-user-name">{currentUser.username}</div>
                  <div className="profile-menu-user-sub">
                    {currentUser.full_name || `@${currentUser.username}`}
                  </div>
                </div>
              </div>
            )}

            <div className="profile-menu-list">
              {/* Option 1: Saved Posts */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={handleGoSavedPosts}
              >
                <div className="profile-menu-item-icon icon-purple">
                  <Bookmark size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label">Bài viết đã lưu</div>
                  <div className="profile-menu-item-desc">Xem lại các bài viết và bộ sưu tập đã lưu</div>
                </div>
                <ChevronRight size={18} className="profile-menu-chevron" />
              </button>

              {/* Option 2: Switch Account */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => setView('accounts')}
              >
                <div className="profile-menu-item-icon icon-emerald">
                  <Users size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label">Chuyển đổi tài khoản</div>
                  <div className="profile-menu-item-desc">
                    {savedAccounts.length > 1
                      ? `${savedAccounts.length} tài khoản đã liên kết`
                      : 'Đổi sang tài khoản khác'}
                  </div>
                </div>
                <ChevronRight size={18} className="profile-menu-chevron" />
              </button>

              {/* Option 3: Add Account */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={handleAddAccount}
              >
                <div className="profile-menu-item-icon icon-blue">
                  <UserPlus size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label">Thêm tài khoản</div>
                  <div className="profile-menu-item-desc">Đăng nhập tài khoản mới trên thiết bị</div>
                </div>
                <ChevronRight size={18} className="profile-menu-chevron" />
              </button>

              {/* Option: Đang nhận dự án / Tìm việc làm (Collaborate & Hire) */}
              <div className="profile-menu-item" style={{ cursor: 'default' }}>
                <div
                  className="profile-menu-item-icon"
                  style={{
                    background: isOpenForCollab ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: isOpenForCollab ? '#10b981' : '#94a3b8'
                  }}
                >
                  <Briefcase size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Đang nhận dự án</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isOpenForCollab ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: isOpenForCollab ? '#10b981' : '#94a3b8',
                      fontWeight: '700'
                    }}>
                      {isOpenForCollab ? '🟢 Đang nhận' : '⚪ Tạm ngưng'}
                    </span>
                  </div>
                  <div className="profile-menu-item-desc">
                    {isOpenForCollab
                      ? 'Hiển thị trong Tìm & Hợp tác NST để khách hàng liên hệ'
                      : 'Ẩn hồ sơ khỏi danh sách tìm kiếm Nhà Sáng Tạo'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleOpenForCollab}
                  disabled={togglingCollab}
                  title={isOpenForCollab ? 'Bấm để tạm ngưng nhận dự án' : 'Bấm để bật nhận dự án'}
                  style={{
                    background: isOpenForCollab ? '#10b981' : '#475569',
                    border: 'none',
                    borderRadius: '999px',
                    width: '46px',
                    height: '26px',
                    padding: '3px',
                    cursor: togglingCollab ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpenForCollab ? 'flex-end' : 'flex-start',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>

              {/* Option: Xin cấp Tích Xanh */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => {
                  onClose();
                  if (onRequestVerification) onRequestVerification();
                }}
              >
                <div className="profile-menu-item-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <ShieldCheck size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label" style={{ color: '#38bdf8', fontWeight: '600' }}>Xin cấp Tích Xanh 🛡️</div>
                  <div className="profile-menu-item-desc">Gửi yêu cầu xét duyệt huy hiệu xác minh Nhà sáng tạo</div>
                </div>
                <ChevronRight size={18} className="profile-menu-chevron" />
              </button>

              <div className="profile-menu-divider" />

              {/* Option 4: Log out */}
              <button
                type="button"
                className="profile-menu-item profile-menu-item-danger"
                onClick={handleLogout}
              >
                <div className="profile-menu-item-icon icon-red">
                  <LogOut size={20} />
                </div>
                <div className="profile-menu-item-content">
                  <div className="profile-menu-item-label">Đăng xuất</div>
                  <div className="profile-menu-item-desc">Đăng xuất khỏi @{currentUser?.username}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SWITCH ACCOUNTS */}
        {view === 'accounts' && (
          <div className="profile-menu-body">
            <div className="profile-accounts-list">
              {savedAccounts && savedAccounts.length > 0 ? (
                savedAccounts.map((acc) => {
                  const isCurrent = Number(acc.user_id) === Number(currentUser?.user_id);
                  return (
                    <div
                      key={acc.user_id}
                      className={`profile-account-row ${isCurrent ? 'active-account' : ''}`}
                      onClick={() => handleSwitch(acc.user_id)}
                    >
                      <Avatar user={acc} size={44} />
                      <div className="profile-account-meta">
                        <div className="profile-account-username">{acc.username}</div>
                        <div className="profile-account-sub">
                          {isCurrent ? (
                            <span className="profile-account-badge-active">Đang hoạt động</span>
                          ) : (
                            acc.full_name || `@${acc.username}`
                          )}
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="profile-account-check">
                          <Check size={18} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="profile-account-remove-btn"
                          title="Xóa khỏi thiết bị"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedAccount(acc.user_id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="profile-menu-empty">Chưa có tài khoản nào được lưu</div>
              )}
            </div>

            <div className="profile-accounts-footer">
              <button
                type="button"
                className="btn-add-account-full"
                onClick={handleAddAccount}
              >
                <UserPlus size={18} />
                <span>Đăng nhập vào tài khoản khác</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileMenuModal;

