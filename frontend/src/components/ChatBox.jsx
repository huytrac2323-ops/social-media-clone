import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Circle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

const socket = io(SOCKET_URL, { secure: true, transports: ['websocket', 'polling'] });

export default function ChatBox({ currentUser, friendId, friendName }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherIsTyping, setOtherIsTyping] = useState(false);
    const [online, setOnline] = useState(false);
    const [readMessageIds, setReadMessageIds] = useState(new Set());
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!currentUser || !currentUser.user_id || !friendId) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/messages/${currentUser.user_id}/${friendId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            }
        };

        fetchMessages();
        socket.emit('user_online', currentUser.user_id);
        socket.emit('mark_messages_read', { reader_id: currentUser.user_id, sender_id: friendId });
    }, [currentUser, friendId]);

    useEffect(() => {
        const handleReceiveMessage = (newMessage) => {
            const isRelevant =
                (newMessage.sender_id === currentUser?.user_id && newMessage.receiver_id === friendId) ||
                (newMessage.sender_id === friendId && newMessage.receiver_id === currentUser?.user_id);

            if (isRelevant) {
                setMessages((prev) => [...prev, newMessage]);
                if (Number(newMessage.sender_id) === Number(friendId)) {
                    socket.emit('mark_messages_read', { reader_id: currentUser.user_id, sender_id: friendId });
                }
            }
        };
        const handleTyping = ({ user_id, isTyping: typing }) => {
            if (Number(user_id) === Number(friendId)) setOtherIsTyping(typing);
        };
        const handlePresence = ({ userId, online: isOnline }) => {
            if (Number(userId) === Number(friendId)) setOnline(isOnline);
        };
        const handleRead = ({ sender_id }) => {
            if (Number(sender_id) === Number(currentUser?.user_id)) {
                setReadMessageIds(prev => new Set([...prev, ...messages.filter(msg => Number(msg.sender_id) === Number(currentUser.user_id)).map(msg => msg.id || msg.message_id)]));
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('user_typing', handleTyping);
        socket.on('presence_changed', handlePresence);
        socket.on('messages_read', handleRead);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('user_typing', handleTyping);
            socket.off('presence_changed', handlePresence);
            socket.off('messages_read', handleRead);
        };
    }, [currentUser, friendId, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        socket.emit("send_message", {
            sender_id: currentUser.user_id,
            receiver_id: friendId,
            message_text: text
        });

        setText('');
        setIsTyping(false);
        socket.emit('typing', { sender_id: currentUser.user_id, receiver_id: friendId, isTyping: false });
    };

    return (
        <div style={{
            width: '340px',
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-hover)',
            overflow: 'hidden'
        }}>
            {/* Online Status Header */}
            <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-elevated)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Circle
                        size={8}
                        fill={online ? '#10b981' : '#64748b'}
                        color={online ? '#10b981' : '#64748b'}
                    />
                    <span style={{ color: online ? '#10b981' : 'var(--text-muted)', fontWeight: '600' }}>
                        {online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </span>
                </div>
                {otherIsTyping && (
                    <span style={{ color: 'var(--accent-primary)', fontSize: '11.5px', fontStyle: 'italic' }}>
                        đang soạn tin...
                    </span>
                )}
            </div>

            {/* Messages Scroll Area */}
            <div
                className="no-scrollbar"
                style={{
                    height: '240px',
                    overflowY: 'auto',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    background: 'var(--bg-main)'
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '70px' }}>
                        Hãy gửi lời chào đầu tiên! 👋
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = Number(msg.sender_id) === Number(currentUser?.user_id);
                        return (
                            <div
                                key={msg.id || msg.message_id || index}
                                style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    background: isMe ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : 'var(--bg-card)',
                                    border: isMe ? 'none' : '1px solid var(--border-subtle)',
                                    padding: '8px 14px',
                                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    maxWidth: '82%',
                                    fontSize: '13.5px',
                                    color: isMe ? '#ffffff' : 'var(--text-primary)',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >
                                {msg.message_text}
                                {isMe && (
                                    <small style={{ display: 'block', opacity: 0.75, fontSize: '9.5px', textAlign: 'right', marginTop: '2px' }}>
                                        {readMessageIds.has(msg.id || msg.message_id) ? 'Đã xem' : 'Đã gửi'}
                                    </small>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => {
                        if (!isTyping) {
                            setIsTyping(true);
                            socket.emit('typing', { sender_id: currentUser.user_id, receiver_id: friendId, isTyping: true });
                        }
                    }}
                    onBlur={() => {
                        setIsTyping(false);
                        socket.emit('typing', { sender_id: currentUser.user_id, receiver_id: friendId, isTyping: false });
                    }}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        flex: 1,
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        padding: '9px 14px',
                        borderRadius: '999px',
                        fontSize: '13px'
                    }}
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    style={{
                        background: text.trim() ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : 'var(--bg-elevated)',
                        border: 'none',
                        color: text.trim() ? 'white' : 'var(--text-muted)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        cursor: text.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
}