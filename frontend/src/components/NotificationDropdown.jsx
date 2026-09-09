import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, CheckCheck, BellOff, MessageSquare, Heart, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function NotificationDropdown({ compact = false }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!currentUser?.user_id) {
            setNotifications([]);
            return undefined;
        }

        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${API_URL}/notifications/${currentUser.user_id}`);
                if (!response.ok) throw new Error('Không thể tải thông báo.');
                setNotifications(await response.json());
            } catch (error) {
                console.error('Lỗi khi tải thông báo:', error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = event => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(item => !(item.is_read || item.isRead)).length;

    const markAsRead = async (e) => {
        e?.stopPropagation();
        if (!currentUser?.user_id || !unreadCount) return;
        try {
            await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
            setNotifications(previous => previous.map(item => ({ ...item, is_read: true })));
        } catch (err) {
            console.error('Lỗi khi đánh dấu đã đọc:', err);
        }
    };

    const openNotification = async notification => {
        if (!(notification.is_read || notification.isRead)) await markAsRead();
        setIsOpen(false);
        if (notification.post_id) navigate(`/post/${notification.post_id}`);
        else if (notification.username) navigate(`/profile/${encodeURIComponent(notification.username)}`);
    };

    const getNotificationIcon = (content = '') => {
        const lower = content.toLowerCase();
        if (lower.includes('thích') || lower.includes('like')) return <Heart size={15} color="#f43f5e" />;
        if (lower.includes('bình luận') || lower.includes('comment')) return <MessageSquare size={15} color="#60a5fa" />;
        if (lower.includes('kết bạn') || lower.includes('theo dõi')) return <UserPlus size={15} color="#34d399" />;
        return <Bell size={15} color="#60a5fa" />;
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                type="button"
                className={compact ? 'mobile-header-icon-btn' : `nav-link-item ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(previous => !previous)}
                aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
                style={compact ? { position: 'relative' } : { position: 'relative', width: '100%', cursor: 'pointer' }}
            >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Bell size={compact ? 18 : 20} />
                    {unreadCount > 0 && (
                        <span style={{
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
                            lineHeight: '14px'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
                {!compact && <span>Thông báo</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown" role="dialog" aria-label="Thông báo">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border-subtle)'
                    }}>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Thông báo</div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {unreadCount ? `${unreadCount} chưa đọc` : 'Bạn đã xem hết'}
                            </span>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAsRead}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#60a5fa',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <CheckCheck size={14} />
                                <span>Đã đọc hết</span>
                            </button>
                        )}
                    </div>
                    <div className="no-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <BellOff size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                <p style={{ fontSize: '13px' }}>Chưa có thông báo nào</p>
                            </div>
                        ) : notifications.map(notification => {
                            const isRead = notification.is_read || notification.isRead;
                            return (
                                <button
                                    type="button"
                                    key={notification.notification_id}
                                    onClick={() => openNotification(notification)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: isRead ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.18s ease',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                                    }}
                                >
                                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                                        {getNotificationIcon(notification.content)}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                            <strong style={{ color: 'var(--text-primary)', marginRight: '4px' }}>
                                                {notification.username || 'Người dùng'}
                                            </strong>
                                            <span style={{ color: '#cbd5e1' }}>{notification.content}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {notification.created_at ? new Date(notification.created_at).toLocaleString('vi-VN', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            }) : ''}
                                        </div>
                                    </div>
                                    {!isRead && (
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'var(--accent-primary)',
                                            marginTop: '6px',
                                            flexShrink: 0
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;
