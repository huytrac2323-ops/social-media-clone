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


    const handleAddFriend = async (friendId) => {
        await fetch(`${API_URL}/friends/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.user_id, friend_id: friendId })
        });
        alert("Đã thêm bạn! Tải lại trang để xem bài viết của họ.");
        window.location.reload(); // Hoặc gọi hàm refreshData
    };








    ///////////////////////* Giao diện*//////////////////////////////////////
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

            </div>

            <CreatePost onPostCreated={onPostCreated} />

            {/* Khối Gợi ý kết bạn luôn hiển thị */}
            <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', marginTop: '20px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>👥 Gợi ý kết bạn</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.map(user => (
                            <div key={user.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3a3b3c', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={user.profile_photo_url || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                                    <span style={{ fontSize: '14px' }}>{user.username}</span>
                                </div>
                                <button
                                    onClick={() => handleAddFriend(user.user_id)}
                                    style={{ background: '#2d88ff', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Thêm bạn
                                </button>
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Không có gợi ý nào mới</p>
                    )}
                </div>
            </div>



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