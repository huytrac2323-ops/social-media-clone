import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Tự động nhận diện môi trường để kết nối API và Socket
const API_URL = 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = 'https://social-media-clone-di9z.onrender.com';


// Khởi tạo kết nối Socket ở ngoài component để tránh render lại nhiều lần
const socket = io(SOCKET_URL);

export default function ChatBox({ currentUser, friendId, friendName }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);

    // 1. Tải lịch sử tin nhắn ban đầu (Chỉ gọi 1 lần, bỏ setInterval)
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
    }, [currentUser, friendId]);

    // 2. Lắng nghe tin nhắn mới từ Socket.io theo thời gian thực
    useEffect(() => {
        const handleReceiveMessage = (newMessage) => {
            // Kiểm tra xem tin nhắn nhận được có đúng là của cuộc hội thoại này không
            const isRelevant =
                (newMessage.sender_id === currentUser?.user_id && newMessage.receiver_id === friendId) ||
                (newMessage.sender_id === friendId && newMessage.receiver_id === currentUser?.user_id);

            if (isRelevant) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        // Hủy lắng nghe khi đóng khung chat để tránh trùng lặp tin nhắn
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [currentUser, friendId]);

    // Cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 3. Gửi tin nhắn qua Socket thay vì Fetch API
    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        // Bắn sự kiện lên Backend với đúng các trường dữ liệu
        socket.emit("send_message", {
            sender_id: currentUser.user_id,
            receiver_id: friendId,
            message_text: text
        });

        // Xóa ô nhập (Tin nhắn sẽ tự cập nhật vào mảng khi nhận lại từ 'receive_message')
        setText('');
    };

    return (
        <div style={{ width: '300px', background: '#242526', border: '1px solid #3e4042', borderRadius: '8px', color: 'white', padding: '10px' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #3e4042', paddingBottom: '5px' }}>
                Chat với {friendName}
            </div>

            <div style={{ height: '200px', overflowY: 'auto', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.map((msg, index) => (
                    <div key={msg.id || msg.message_id || index} style={{
                        alignSelf: msg.sender_id === currentUser?.user_id ? 'flex-end' : 'flex-start',
                        background: msg.sender_id === currentUser?.user_id ? '#0084ff' : '#3a3b3c',
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