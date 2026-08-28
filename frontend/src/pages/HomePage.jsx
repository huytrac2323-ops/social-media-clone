import React, { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import { Button } from "../components/ui/button.jsx";
import NotificationDropdown from "../components/NotificationDropdown.jsx";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();


// Tự động nhận diện môi trường Localhost hay Online
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://social-media-clone-di9z.onrender.com/api';
    // 👇 Thêm state và useEffect để lấy danh sách người đã từng nhắn tin
    const [conversations, setConversations] = useState([]);



    useEffect(() => {
        // Chặn tuyệt đối việc gọi API nếu chưa tải xong user_id
        if (!currentUser || !currentUser.user_id) return;

        const fetchConversations = async () => {
            try {
                const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
                const data = await res.json();
                if (res.ok) setConversations(data);
            } catch (err) {
                console.error("Lỗi tải trò chuyện gần đây:", err);
            }
        };

        fetchConversations();

        // Bọc hàm async lại để làm hài lòng trình kiểm tra lỗi (linter)
        const interval = setInterval(() => {
            fetchConversations();
        }, 3000);

        return () => clearInterval(interval);
    }, [currentUser]);
    return (
        <div className="home-page-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {/* Thanh công cụ phía trên gồm nút Đã lưu và Dropdown thông báo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Link
                    to="/saved-posts"
                    style={{ color: '#fff', textDecoration: 'none', background: '#3a3b3c', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}
                >
                    🔖 Bài viết đã lưu
                </Link>

                <NotificationDropdown />
            </div>

            <CreatePost onPostCreated={onPostCreated} />

            {/* Hiển thị danh sách bài viết */}
            <div className="posts-list" style={{ marginTop: '20px' }}>
                {posts && posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard
                            key={post.post_id || post.id}
                            post={post}
                            onLike={onLike}
                            onCommentSubmit={onCommentSubmit}
                            onPostDeleted={onPostDeleted}
                            onPostUpdated={onPostUpdated}
                        />
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#888' }}>Chưa có bài viết nào.</p>
                )}
            </div>

            <div style={{ marginTop: '20px' }}>
                <Button variant="outline">Click me</Button>
            </div>

            {/* Cố định danh sách trò chuyện gần đây ở góc trên bên phải */}
            <div className="home-chat-sidebar" style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                width: '260px',
                background: '#242526',
                padding: '15px',
                borderRadius: '8px',
                color: 'white',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
                <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>💬 Trò chuyện gần đây</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                    {/* 👇 Đã thay thế allUsers bằng conversations */}
                    {conversations && conversations.length > 0 ? (
                        conversations.map(u => (
                            <div
                                key={u.user_id}
                                onClick={() => {
                                    localStorage.setItem('activeChatUser', JSON.stringify({
                                        user_id: u.user_id,
                                        username: u.username
                                    }));
                                    window.dispatchEvent(new Event('open-chat'));
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: '#3a3b3c' }}
                            >
                                <img src={u.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                <span style={{ fontSize: '14px' }}>{u.username}</span>
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Chưa có cuộc trò chuyện nào</p>
                    )}
                </div>
            </div>
        </div>
    );
}