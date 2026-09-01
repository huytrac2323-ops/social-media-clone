import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../../context/AuthContext'; // Nhớ kiểm tra lại đường dẫn
import './ChatWidget.css';

function ChatWidget() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

    // Hàm lấy danh sách những người đã nhắn tin
    const fetchConversations = async () => {
        if (!currentUser?.user_id) return;
        try {
            const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error(err); }
    };

    // Tự động gọi hàm lấy dữ liệu khi component được render hoặc đổi user
    useEffect(() => {
        fetchConversations();

        // Cập nhật danh sách mỗi 3 giây
        const interval = setInterval(() => {
            fetchConversations();
        }, 3000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Xử lý khi bấm vào 1 người trong danh sách chat
    const handleOpenChat = (user) => {
        // 1. Lưu thông tin người chat vào bộ nhớ tạm
        localStorage.setItem('activeChatUser', JSON.stringify({ user_id: user.user_id, username: user.username }));

        // 2. Kích hoạt sự kiện mở khung chat chi tiết
        window.dispatchEvent(new Event('open-chat'));

        // 3. THÊM DÒNG NÀY: Thu nhỏ danh sách lịch sử lại thành bong bóng
        setIsOpen(false);
    };

    return (
        <div className="chat-wrapper">
            {isOpen ? (
                // Cửa sổ chat cố định góc dưới
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Trò chuyện</span>
                        {/* Nút thu nhỏ thành bong bóng */}
                        <button onClick={() => setIsOpen(false)}>✖</button>
                    </div>
                    <div className="chat-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {conversations && conversations.length > 0 ? (
                            conversations.map(u => (
                                <div
                                    key={u.user_id}
                                    onClick={() => handleOpenChat(u)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '6px', background: '#3a3b3c', marginBottom: '8px' }}
                                >
                                    <img
                                        src={u.profile_photo_url || 'https://via.placeholder.com/30'}
                                        alt="avatar"
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{u.username}</span>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginTop: '20px' }}>Chưa có trò chuyện nào.</p>
                        )}
                    </div>
                </div>
            ) : (
                // Bong bóng chat khi thu nhỏ
                <Draggable bounds="body">
                    <div className="chat-bubble" onClick={() => setIsOpen(true)}>
                        💬
                    </div>
                </Draggable>
            )}
        </div>
    );
}

export default ChatWidget;