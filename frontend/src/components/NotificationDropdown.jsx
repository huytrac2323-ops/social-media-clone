import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

function NotificationDropdown({ compact = false }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!currentUser?.user_id) {
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

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.emit('user_online', currentUser.user_id);
        const handleRealtimeNotification = notification => {
            if (String(notification.receiver_id) !== String(currentUser.user_id)) return;
            setNotifications(previous => {
                if (previous.some(item => item.notification_id === notification.notification_id)) return previous;
                return [notification, ...previous].slice(0, 50);
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
    const unreadCount = visibleNotifications.filter(item => !(item.is_read || item.isRead)).length;
    const isActive = location.pathname === '/notifications';

    return (
        <div className="notification-wrapper">
            <button
                type="button"
                className={compact ? 'mobile-header-icon-btn' : `nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate('/notifications')}
                aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
                title="Thông báo"
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
        </div>
    );
}

export default NotificationDropdown;
