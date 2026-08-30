import React, { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import { Button } from "../components/ui/button.jsx";
import NotificationDropdown from "../components/NotificationDropdown.jsx";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();


    const API_URL = 'https://social-media-clone-di9z.onrender.com/api';



    // 👇 Thêm state và useEffect để lấy danh sách người đã từng nhắn tin
    const [conversations, setConversations] = useState([]);
    const [suggestions, setSuggestions] = useState([]);


    useEffect(() => {
        // Chặn gọi API nếu chưa có thông tin user
        if (!currentUser?.user_id) return;

        // 1. Hàm tải lịch sử trò chuyện (Cần cập nhật liên tục)
        const fetchConversations = async () => {
            try {
                const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (err) {
                console.error("Lỗi tải trò chuyện gần đây:", err);
            }
        };

        // 2. Hàm tải gợi ý kết bạn (Chỉ cần tải 1 lần)
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`${API_URL}/suggestions/${currentUser.user_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Lỗi tải gợi ý kết bạn:", err);
            }
        };

        // Kích hoạt gọi dữ liệu ngay khi mở component
        fetchConversations();
        fetchSuggestions();

        // Thiết lập vòng lặp 3 giây CHỈ DÀNH CHO trò chuyện
        const interval = setInterval(() => {
            fetchConversations();
        }, 3000);

        // Dọn dẹp bộ nhớ khi thoát component
        return () => clearInterval(interval);
    }, [currentUser]);


    const handleSendRequest = async (friendId) => {
        try {
            const response = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, friend_id: friendId })
            });

            if (response.ok) {
                alert("Đã gửi yêu cầu kết bạn! Vui lòng đợi đối phương chấp nhận.");
                window.location.reload();
            } else {
                alert("Không thể gửi yêu cầu lúc này.");
            }
        } catch (err) {
            console.error("Lỗi kết bạn:", err);
        }
    };








    ///////////////////////* Giao diện*//////////////////////////////////////
    return (
        <div className="home-page-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

            {/* Thanh công cụ phía trên gồm nút Đã lưu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Link
                    to="/saved-posts"
                    style={{ color: '#fff', textDecoration: 'none', background: '#3a3b3c', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}
                >
                    🔖 Bài viết đã lưu
                </Link>
            </div>

            <CreatePost onPostCreated={onPostCreated} />

            {/* Hiển thị danh sách bài viết ở chính giữa */}
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

            {/* Cố định cột bên phải: Gợi ý kết bạn (trên) và Trò chuyện gần đây (dưới) */}
            <div className="home-right-sidebar" style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                width: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
                zIndex: 100
            }}>
                {/* 1. Khối Gợi ý kết bạn ở bên phải */}
                <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>👥 Gợi ý kết bạn</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions && suggestions.length > 0 ? (
                            suggestions.map(user => (
                                <div key={user.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3a3b3c', padding: '8px', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <img src={user.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
                                    </div>
                                    <button
                                        onClick={() => handleSendRequest(user.user_id)}
                                        style={{ background: '#0084ff', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                    >
                                        Thêm bạn
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>Không có gợi ý nào</p>
                        )}
                    </div>
                </div>

                {/* 2. Khối Trò chuyện gần đây ở bên phải */}
                <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>💬 Trò chuyện gần đây</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
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
                                    <img src={u.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <span style={{ fontSize: '13px' }}>{u.username}</span>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>Chưa có cuộc trò chuyện nào</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}