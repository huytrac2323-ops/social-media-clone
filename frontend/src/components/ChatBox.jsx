import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';

export default function ChatBox({ currentUser, friendId, friendName }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);

    // Lấy lịch sử trò chuyện
    useEffect(() => {
        if (!currentUser || !friendId) return;
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/messages/${currentUser.user_id}/${friendId}`);
                const data = await res.json();
                if (res.ok) setMessages(data);
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll tin nhắn mỗi 3 giây
        return () => clearInterval(interval);
    }, [currentUser, friendId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Gửi tin nhắn
    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            const res = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: currentUser.user_id,
                    receiver_id: friendId,
                    message_text: text
                })
            });
            const newMessage = await res.json();
            if (res.ok) {
                setMessages([...messages, newMessage]);
                setText('');
            }
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
        }
    };

    return (
        <div style={{ width: '300px', background: '#242526', border: '1px solid #3e4042', borderRadius: '8px', color: 'white', padding: '10px' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #3e4042', paddingBottom: '5px' }}>
                Chat với {friendName}
            </div>

            {/* Khung chứa danh sách tin nhắn */}
            <div style={{ height: '200px', overflowY: 'auto', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.map((msg) => (
                    <div key={msg.message_id} style={{
                        alignSelf: msg.sender_id === currentUser.user_id ? 'flex-end' : 'flex-start',
                        background: msg.sender_id === currentUser.user_id ? '#0084ff' : '#3a3b3c',
                        padding: '6px 10px', borderRadius: '10px', maxWidth: '80%', fontSize: '14px', color: 'white'
                    }}>
                        {msg.message_text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '5px' }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    style={{ flex: 1, background: '#3a3b3c', border: 'none', color: 'white', padding: '6px', borderRadius: '4px' }}
                />
                <button type="submit" style={{ background: '#0084ff', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>Gửi</button>
            </form>
        </div>
    );
    }