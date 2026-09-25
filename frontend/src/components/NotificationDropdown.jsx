import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import {
  Bell,
  CheckCheck,
  Check,
  Heart,
  MessageSquare,
  UserPlus,
  Crown,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function NotificationDropdown({ compact = false }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [friendActionStates, setFriendActionStates] = useState({});
  const dropdownRef = useRef(null);

  const handleAcceptFriend = async (e, notif) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/friends/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.user_id,
          friend_id: notif.sender_id
        })
      });
      if (res.ok) {
        setFriendActionStates(prev => ({ ...prev, [notif.notification_id]: 'accepted' }));
      }
    } catch (err) {
      console.error('Lỗi chấp nhận kết bạn:', err);
    }
  };

  const handleRejectFriend = async (e, notif) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/friends/unfriend`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.user_id,
          friend_id: notif.sender_id
        })
      });
      if (res.ok) {
        setFriendActionStates(prev => ({ ...prev, [notif.notification_id]: 'rejected' }));
      }
    } catch (err) {
      console.error('Lỗi từ chối kết bạn:', err);
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng dropdown khi đổi đường dẫn (route)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fetch & realtime notifications
  useEffect(() => {
    if (!currentUser?.user_id) return undefined;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/notifications/${currentUser.user_id}`);
        if (!response.ok) throw new Error('Không thể tải thông báo.');
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      }
    };

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('user_online', currentUser.user_id);

    const handleRealtimeNotification = (notification) => {
      if (String(notification.receiver_id) !== String(currentUser.user_id)) return;
      setNotifications((prev) => {
        if (prev.some((item) => item.notification_id === notification.notification_id)) return prev;
        return [notification, ...prev].slice(0, 50);
      });
    };

    socket.on('notification_created', handleRealtimeNotification);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(interval);
      socket.off('notification_created', handleRealtimeNotification);
      socket.disconnect();
    };
  }, [currentUser]);

  const visibleNotifications = currentUser?.user_id ? notifications : [];
  const unreadCount = visibleNotifications.filter((item) => !(item.is_read || item.isRead)).length;
  const isActive = location.pathname === '/notifications';

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    if (!currentUser?.user_id) return;
    try {
      await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, isRead: true })));
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  // Click vào 1 thông báo
  const handleItemClick = async (notif) => {
    const isRead = notif.is_read || notif.isRead;
    if (!isRead && currentUser?.user_id) {
      try {
        await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((item) =>
            item.notification_id === notif.notification_id
              ? { ...item, is_read: true, isRead: true }
              : item
          )
        );
      } catch (err) {
        console.error(err);
      }
    }

    setIsOpen(false);

    if (notif.post_id) {
      navigate(`/post/${notif.post_id}`);
    } else if (notif.username) {
      navigate(`/profile/${encodeURIComponent(notif.username)}`);
    } else {
      navigate('/notifications');
    }
  };

  const renderNotifIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={14} color="#ef4444" fill="#ef4444" />;
      case 'comment':
        return <MessageSquare size={14} color="#3b82f6" />;
      case 'follow':
      case 'friend_request':
        return <UserPlus size={14} color="#10b981" />;
      case 'vip_upgrade':
        return <Crown size={14} color="#eab308" />;
      default:
        return <Sparkles size={14} color="#a855f7" />;
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className={compact ? 'mobile-header-icon-btn' : `nav-link-item ${isOpen || isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
        title="Thông báo"
        style={
          compact
            ? { position: 'relative' }
            : { position: 'relative', width: '100%', cursor: 'pointer' }
        }
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Bell size={compact ? 18 : 20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: '999px',
                minWidth: '16px',
                textAlign: 'center',
                lineHeight: '14px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {!compact && <span>Thông báo</span>}
      </button>

      {/* DROPDOWN SỔ XUỐNG KHI CLICK VÀO CHUÔNG */}
      {isOpen && (
        <div
          className="notification-popover-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: compact ? '-60px' : '-20px',
            width: '390px',
            maxWidth: '92vw',
            background: 'var(--bg-surface, #1e2634)',
            border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.14))',
            borderRadius: '18px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.25)',
            zIndex: 999999,
            overflow: 'hidden',
            animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header Panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              background: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.03))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary, #38bdf8)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  borderRadius: '6px'
                }}
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Body List */}
          <div
            className="no-scrollbar"
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {visibleNotifications.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: 'var(--text-muted)'
                }}
              >
                <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              visibleNotifications.slice(0, 20).map((notif) => {
                const isRead = notif.is_read || notif.isRead;
                const isFriendReq = notif.type === 'friend_request' || notif.type === 'follow_request' || (notif.content && notif.content.toLowerCase().includes('kết bạn'));
                const friendStatus = friendActionStates[notif.notification_id] || notif.friend_status;
                return (
                  <div
                    key={notif.notification_id || notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isRead
                        ? 'transparent'
                        : 'rgba(56, 189, 248, 0.08)',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                      marginBottom: '2px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isRead
                        ? 'var(--bg-card-hover, rgba(255, 255, 255, 0.05))'
                        : 'rgba(56, 189, 248, 0.14)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isRead
                        ? 'transparent'
                        : 'rgba(56, 189, 248, 0.08)';
                    }}
                  >
                    {/* User Avatar with Badge Icon */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar
                        user={{
                          username: notif.username,
                          profile_photo_url: notif.profile_photo_url
                        }}
                        size={38}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface, #1e2634)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        {renderNotifIcon(notif.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                          fontWeight: isRead ? '400' : '600',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {notif.content || 'Bạn có thông báo mới từ hệ thống.'}
                      </p>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          display: 'block'
                        }}
                      >
                        {formatRelativeTime(notif.created_at)}
                      </span>

                      {/* Friend request action buttons */}
                      {isFriendReq && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {friendStatus === 'accepted' ? (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={13} strokeWidth={2.5} /> Đã là bạn bè
                            </span>
                          ) : friendStatus === 'rejected' ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Đã từ chối
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleAcceptFriend(e, notif)}
                                style={{
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  background: '#2563eb',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                                }}
                              >
                                Chấp nhận
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRejectFriend(e, notif)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  background: 'var(--bg-elevated, rgba(255, 255, 255, 0.1))',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                  cursor: 'pointer'
                                }}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Blue unread dot */}
                    {!isRead && (
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#38bdf8',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Panel */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              textAlign: 'center',
              background: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.03))'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary, #38bdf8)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Xem toàn bộ thông báo</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
