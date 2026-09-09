import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../../context/AuthContext';
import './ChatWidget.css';
import Avatar from '../Avatar.jsx';
import { MessageCircle, X, MessagesSquare } from 'lucide-react';

function ChatWidget() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

    // Hàm lấy danh sách những người đã nhắn tin
    const fetchConversations = async () => {
        if (!currentUser?.user_id) return;
        try {
            const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
            if (res.ok) setConversations(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    // Tự động gọi hàm lấy dữ liệu khi component được render hoặc đổi user
    useEffect(() => {
        fetchConversations();

        // Cập nhật danh sách mỗi 5 giây
        const interval = setInterval(() => {
            fetchConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Xử lý khi bấm vào 1 người trong danh sách chat
    const handleOpenChat = (user) => {
        localStorage.setItem('activeChatUser', JSON.stringify({ user_id: user.user_id, username: user.username }));
        window.dispatchEvent(new Event('open-chat'));
        setIsOpen(false);
    };

    if (!currentUser) return null;

    return (
        <div className="chat-wrapper">
            {isOpen ? (
                // Cửa sổ chat cố định góc dưới
                <div className="chat-window">
                    <div className="chat-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessagesSquare size={18} color="#60a5fa" />
                            <span>Tin nhắn</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Đóng danh sách chat"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '6px'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="chat-body no-scrollbar">
                        {conversations && conversations.length > 0 ? (
                            conversations.map(u => (
                                <div
                                    key={u.user_id}
                                    onClick={() => handleOpenChat(u)}
                                    className="chat-user-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        transition: 'background-color 0.2s ease',
                                        marginBottom: '6px'
                                    }}
                                >
                                    <Avatar user={u} size={38} />
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {u.username}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Bấm để mở cuộc trò chuyện
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                <MessageCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                                <p style={{ fontSize: '13px' }}>Chưa có cuộc trò chuyện nào.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Bong bóng chat khi thu nhỏ
                <Draggable bounds="body">
                    <div className="chat-bubble" onClick={() => setIsOpen(true)} title="Tin nhắn">
                        <MessageCircle size={26} />
                    </div>
                </Draggable>
            )}
        </div>
    );
}

export default ChatWidget;