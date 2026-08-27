import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function NotificationDropdown() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!currentUser || !currentUser.user_id) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_URL}/notifications/${currentUser.user_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Lỗi khi tải thông báo:", error);
            }
        };

        fetchNotifications();
    }, [currentUser]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const unreadCount = notifications.filter(n => n.isRead === false || n.is_read === false).length;

    return (
        <div className="notification-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="notification-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: '#3a3b3c', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', position: 'relative' }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e41e3f', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown" style={{ position: 'absolute', top: '50px', right: '0', width: '320px', background: '#242526', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '10px', zIndex: 1000, color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', paddingBottom: '10px', borderBottom: '1px solid #3e4042' }}>Thông báo</h3>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#b0b3b8' }}>Không có thông báo mới.</p>
                        ) : (
                            notifications.map(noti => (
                                <div key={noti.id || noti.notification_id} style={{ padding: '10px', marginBottom: '5px', borderRadius: '8px', background: (noti.isRead || noti.is_read) ? 'transparent' : '#3a3b3c', cursor: 'pointer' }}>
                                    <p style={{ margin: 0, fontSize: '14px' }}>{noti.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;