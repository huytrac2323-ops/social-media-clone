import React, { useState } from 'react';
import io from 'socket.io-client';

const socket = io.connect("http://localhost:5000");

function ChatBox({ friendName = "Người dùng ẩn danh" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');

    // Lắng nghe tin nhắn mới từ Server gửi về
    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        // Dọn dẹp kết nối khi tắt component
        return () => socket.off("receive_message");
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const messageData = {
            id: Date.now(),
            sender: 'me', // Gửi từ mình
            text: inputText
        };

        // Gửi tin nhắn lên Server Node.js ngay lập tức!
        socket.emit("send_message", messageData);

        setInputText('');
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#0084ff', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)', zIndex: 9999 }}>
                💬
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', bottom: '0', right: '20px', width: '300px', background: '#242526', borderRadius: '8px 8px 0 0', boxShadow: '0 0 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', zIndex: 9999, color: 'white', border: '1px solid #3e4042' }}>
            {/* Header Box Chat */}
            <div style={{ padding: '10px', background: '#3a3b3c', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px' }}>{friendName}</strong>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✖</button>
            </div>

            {/* Khung hiển thị tin nhắn */}
            <div style={{ height: '250px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', background: msg.sender === 'me' ? '#0084ff' : '#3e4042', padding: '8px 12px', borderRadius: '15px', maxWidth: '75%', fontSize: '14px', wordWrap: 'break-word' }}>
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Ô nhập tin nhắn */}
            <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #3e4042', display: 'flex', gap: '5px' }}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Aa"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: 'none', background: '#3a3b3c', color: 'white', outline: 'none' }}
                />
                <button type="submit" style={{ background: 'transparent', border: 'none', color: '#0084ff', cursor: 'pointer', fontWeight: 'bold' }}>Gửi</button>
            </form>
        </div>
    );
}

export default ChatBox;