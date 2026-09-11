import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import {
  Bell,
  CheckCheck,
  BellOff,
  MessageSquare,
  Heart,
  UserPlus,
  ArrowLeft,
  Share2,
  Sparkles
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser?.user_id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/notifications/${currentUser.user_id}`);
      if (!response.ok) throw new Error('Không thể tải thông báo.');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.user_id) return undefined;

    fetchNotifications();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('user_online', currentUser.user_id);

    const handleRealtimeNotification = (notification) => {
      if (String(notification.receiver_id) !== String(currentUser.user_id)) return;
      setNotifications(prev => {
        if (prev.some(item => item.notification_id === notification.notification_id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.on('notification_created', handleRealtimeNotification);
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(interval);
      socket.off('notification_created', handleRealtimeNotification);
      socket.disconnect();
    };
  }, [currentUser]);

  const markAllAsRead = async () => {
    if (!currentUser?.user_id) return;
    try {
      await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true, isRead: true })));
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    const isRead = notification.is_read || notification.isRead;
    if (!isRead && currentUser?.user_id) {
      try {
        await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(item =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: true, isRead: true }
            : item
        ));
      } catch (err) {
        console.error(err);
      }
    }

    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.username) {
      navigate(`/profile/${encodeURIComponent(notification.username)}`);
    }
  };

  const getNotificationIcon = (content = '') => {
    const lower = content.toLowerCase();
    if (lower.includes('thích') || lower.includes('like')) {
      return (
        <div style={{ background: '#f43f5e', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={12} color="#ffffff" fill="#ffffff" />
        </div>
      );
    }
    if (lower.includes('bình luận') || lower.includes('comment')) {
      return (
        <div style={{ background: '#3b82f6', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={12} color="#ffffff" />
        </div>
      );
    }
    if (lower.includes('kết bạn') || lower.includes('theo dõi')) {
      return (
        <div style={{ background: '#10b981', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserPlus size={12} color="#ffffff" />
        </div>
      );
    }
    if (lower.includes('chia sẻ') || lower.includes('share')) {
      return (
        <div style={{ background: '#8b5cf6', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={12} color="#ffffff" />
        </div>
      );
    }
    return (
      <div style={{ background: '#64748b', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={12} color="#ffffff" />
      </div>
    );
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  const unreadCount = notifications.filter(n => !(n.is_read || n.isRead)).length;
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !(n.is_read || n.isRead))
    : notifications;

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main style={{ flex: 1, maxWidth: '680px', minWidth: 0, paddingBottom: '80px', margin: '0 auto', width: '100%' }}>
          <div style={{
            background: 'var(--bg-card, #18181b)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: 'var(--radius-lg, 16px)',
            padding: '20px 24px',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.25))'
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary, #a1a1aa)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '50%'
                  }}
                  title="Quay lại"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #ffffff)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={22} color="#0095f6" />
                  Thông báo
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </h1>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck size={14} />
                  <span>Đã đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle, #27272a)', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  background: activeTab === 'all' ? '#0095f6' : 'var(--bg-elevated, #27272a)',
                  color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary, #a1a1aa)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                style={{
                  background: activeTab === 'unread' ? '#0095f6' : 'var(--bg-elevated, #27272a)',
                  color: activeTab === 'unread' ? '#ffffff' : 'var(--text-secondary, #a1a1aa)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            background: 'var(--bg-card, #18181b)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: 'var(--radius-lg, 16px)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.25))'
          }}>
            {!currentUser ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Bell size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #ffffff)', marginBottom: '6px' }}>
                  Vui lòng đăng nhập
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #a1a1aa)', maxWidth: '320px', margin: '0 auto 16px' }}>
                  Đăng nhập tài khoản để nhận thông báo về lượt thích, bình luận và bạn bè.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-profile-primary"
                  style={{ padding: '8px 20px', borderRadius: '999px', fontSize: '13.5px' }}
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted, #a1a1aa)', fontSize: '14px' }}>
                Đang tải thông báo...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                <BellOff size={44} color="#64748b" style={{ margin: '0 auto 14px', opacity: 0.6 }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #ffffff)', marginBottom: '6px' }}>
                  {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #a1a1aa)', maxWidth: '360px', margin: '0 auto' }}>
                  {activeTab === 'unread'
                    ? 'Bạn đã đọc hết tất cả thông báo của mình!'
                    : 'Khi có người tương tác với bạn, thông báo sẽ hiển thị ở đây.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredNotifications.map(notification => {
                  const isRead = notification.is_read || notification.isRead;
                  return (
                    <div
                      key={notification.notification_id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                        background: isRead ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isRead ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(59, 130, 246, 0.06)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        {/* Avatar with action badge */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar
                            user={{
                              username: notification.username,
                              profile_photo_url: notification.profile_photo_url
                            }}
                            size={44}
                          />
                          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}>
                            {getNotificationIcon(notification.content)}
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13.5px', color: 'var(--text-main, #ffffff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            <strong style={{ color: '#ffffff', marginRight: '4px' }}>
                              {notification.username || 'Người dùng'}
                            </strong>
                            <span>{notification.content}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #a1a1aa)', marginTop: '2px' }}>
                            {formatRelativeTime(notification.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!isRead && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#0095f6',
                            flexShrink: 0,
                            marginLeft: '10px'
                          }}
                          title="Chưa đọc"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreatePost && (
        <CreatePost
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => setShowCreatePost(false)}
        />
      )}

      {currentUser && <ChatWidget currentUser={currentUser} />}
    </div>
  );
}

export default NotificationsPage;

