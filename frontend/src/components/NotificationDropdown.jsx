import React, { useState, useEffect } from 'react';

function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        // Dữ liệu giả lập để hiển thị giao diện
        { id: 1, content: 'Nhất Huy đã bình luận về bài viết của bạn', isRead: false },
        { id: 2, content: 'Trần Văn A đã thả tim ảnh của bạn', isRead: true }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ position: 'relative' }}>
            {/* Nút Quả chuông */}
            <button
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

            {/* Hộp thoại thả xuống */}
            {isOpen && (
                <div style={{ position: 'absolute', top: '50px', right: '0', width: '320px', background: '#242526', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '10px', zIndex: 1000, color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', paddingBottom: '10px', borderBottom: '1px solid #3e4042' }}>Thông báo</h3>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#b0b3b8' }}>Không có thông báo mới.</p>
                        ) : (
                            notifications.map(noti => (
                                <div key={noti.id} style={{ padding: '10px', marginBottom: '5px', borderRadius: '8px', background: noti.isRead ? 'transparent' : '#3a3b3c', cursor: 'pointer' }}>
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