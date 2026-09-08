import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function NotificationDropdown() {
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

    const markAsRead = async () => {
        if (!currentUser?.user_id || !unreadCount) return;
        await fetch(`${API_URL}/notifications/${currentUser.user_id}/read`, { method: 'PATCH' });
        setNotifications(previous => previous.map(item => ({ ...item, is_read: true })));
    };

    const openNotification = async notification => {
        if (!(notification.is_read || notification.isRead)) await markAsRead();
        setIsOpen(false);
        if (notification.post_id) navigate(`/post/${notification.post_id}`);
        else if (notification.username) navigate(`/profile/${encodeURIComponent(notification.username)}`);
    };

    return (
        <div className="notification-container" ref={dropdownRef}>
            <button
                type="button"
                className={`notification-btn${isOpen ? ' active' : ''}`}
                onClick={() => setIsOpen(previous => !previous)}
                aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
            >
                <span className="notification-icon">🔔</span>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown" role="dialog" aria-label="Thông báo">
                    <div className="notification-header">
                        <div>
                            <h3>Thông báo</h3>
                            <span>{unreadCount ? `${unreadCount} chưa đọc` : 'Bạn đã xem hết'}</span>
                        </div>
                        {unreadCount > 0 && (
                            <button type="button" className="mark-all-read" onClick={markAsRead}>Đã đọc hết</button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty"><span>🔕</span><p>Chưa có thông báo nào</p></div>
                        ) : notifications.map(notification => {
                            const isRead = notification.is_read || notification.isRead;
                            return (
                                <button
                                    type="button"
                                    key={notification.notification_id}
                                    className={`notification-item${isRead ? '' : ' unread'}`}
                                    onClick={() => openNotification(notification)}
                                >
                                    <span className="notification-item-icon">🔔</span>
                                    <span className="notification-item-content">
                                        <span><strong>{notification.username || 'Một người dùng'}</strong>{' '}{notification.content}</span>
                                        <time>{notification.created_at ? new Date(notification.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</time>
                                    </span>
                                    {!isRead && <span className="unread-dot" />}
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
