import React, { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import NotificationDropdown from "../components/NotificationDropdown.jsx";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();
    const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

    const [conversations, setConversations] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);

    const fetchSuggestions = async () => {
        const currentId = currentUser?.user_id || currentUser?.id || 'guest';
        try {
            const res = await fetch(`${API_URL}/suggestions/${currentId}`);
            if (res.ok) setSuggestions(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchConversations = async () => {
        if (!currentUser?.user_id) return;
        try {
            const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchFriendRequests = async () => {
        if (!currentUser?.user_id) return;
        try {
            const res = await fetch(`${API_URL}/friends/requests/${currentUser.user_id}`);
            if (res.ok) setFriendRequests(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchSuggestions();
        if (currentUser?.user_id || currentUser?.id) {
            fetchConversations();
            fetchFriendRequests();
            const interval = setInterval(() => {
                fetchConversations();
                fetchFriendRequests();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    const handleSendRequest = async (friendId) => {
        const myId = Number(currentUser?.user_id || currentUser?.id);
        const targetId = Number(friendId);
        if (!myId || !targetId) return alert("Lỗi: ID trống!");
        if (myId === targetId) return alert("Không thể tự kết bạn!");

        try {
            const res = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: myId, addressee_id: targetId })
            });
            if (res.ok) { alert("Đã gửi yêu cầu!"); fetchSuggestions(); }
            else alert("Lỗi máy chủ");
        } catch (err) { console.error(err); }
    };

    const handleAcceptFriend = async (requesterId) => {
        await fetch(`${API_URL}/friends/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.user_id, friend_id: requesterId }) });
        alert("Đã chấp nhận kết bạn!"); window.location.reload();
    };

    const handleRejectFriend = async (requesterId) => {
        await fetch(`${API_URL}/friends/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.user_id, friend_id: requesterId }) });
        fetchFriendRequests();
    };

    return (
        <div className="home-page-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', position: 'relative', right: '60px' }}>

            {/* POPUP ĐĂNG BÀI */}
            {showCreatePost && currentUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowCreatePost(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', backgroundColor: '#242526', padding: '20px', borderRadius: '10px' }}>
                        <CreatePost onPostCreated={() => { onPostCreated(); setShowCreatePost(false); }} />
                        <button onClick={() => setShowCreatePost(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#3a3b3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy / Đóng</button>
                    </div>
                </div>
            )}

            {/* BẢNG TIN TRUNG TÂM */}
            <div className="posts-list">
                {posts && posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.post_id || post.id} post={post} onLike={onLike} onCommentSubmit={onCommentSubmit} onPostDeleted={onPostDeleted} onPostUpdated={onPostUpdated} />)
                ) : (
                    <p style={{ textAlign: 'center', color: '#888' }}>Chưa có bài viết nào.</p>
                )}
            </div>

            {/* THANH BÊN TRÁI */}
            <div className="home-left-sidebar">
                {/* 1. Trang chủ */}
                <Link to="/" className="sidebar-box mobile-only-btn" style={{ textDecoration: 'none' }}>
                    <h3>🏠<span>Trang chủ</span></h3>
                </Link>

                {currentUser ? (
                    <>
                        {/* 2. Trang cá nhân */}
                        <Link to={`/profile/${currentUser.username}`} className="sidebar-box mobile-only-btn" style={{ textDecoration: 'none' }}>
                            <h3>👤<span>{currentUser.username}</span></h3>
                        </Link>

                        <Link to="/saved-posts" className="sidebar-box" style={{ textDecoration: 'none' }}>
                            <h3>🔖<span>Bài đã lưu</span></h3>
                        </Link>

                        {/* 3. Đăng bài */}
                        <div className="sidebar-box mobile-only-btn" onClick={() => setShowCreatePost(true)}>
                            <h3>✍️<span>Đăng bài</span></h3>
                        </div>

                        {/* 4. Nhắn tin */}
                        <div className="sidebar-box mobile-only-btn" onClick={() => setIsChatExpanded(!isChatExpanded)}>
                            <h3>💬<span>Nhắn tin</span></h3>
                        </div>

                        <div className="sidebar-box">
                            <h3>🔍<span>Tìm kiếm</span></h3>
                            <div className="sidebar-content">
                                <input type="text" placeholder="Tìm kiếm..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', outline: 'none', background: '#3a3b3c', color: 'white' }} />
                            </div>
                        </div>

                        <div className="sidebar-box">
                            <h3>🌍<span>Thông báo</span></h3>
                            <div className="sidebar-content">
                                <NotificationDropdown />
                            </div>
                        </div>

                        <div className="sidebar-box">
                            <h3>🤝<span>Lời mời kết bạn</span></h3>
                            <div className="sidebar-content">
                                {friendRequests && friendRequests.length > 0 ? (
                                    friendRequests.map(reqUser => (
                                        <div key={reqUser.user_id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#3a3b3c', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={reqUser.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                <span style={{ fontSize: '13px' }}>{reqUser.username}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => handleAcceptFriend(reqUser.user_id)} style={{ background: '#2d88ff', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: 1 }}>Chấp nhận</button>
                                                <button onClick={() => handleRejectFriend(reqUser.user_id)} style={{ background: '#4e4f50', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: 1 }}>Xóa</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: '12px', color: '#888' }}>Không có lời mời</p>
                                )}
                            </div>
                        </div>

                        <div className="sidebar-box" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} style={{ marginTop: 'auto' }}>
                            <h3 style={{ color: '#ff4d4d' }}>🚪<span>Đăng xuất</span></h3>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="sidebar-box" style={{ textDecoration: 'none' }}>
                        <h3>🔑<span>Đăng nhập</span></h3>
                    </Link>
                )}
            </div>

            {/* THANH BÊN PHẢI (Gợi ý kết bạn) */}
            <div className="home-right-sidebar" style={{ position: 'fixed', top: '20px', right: '140px', width: '280px', zIndex: 100 }}>
                <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>👥 Gợi ý kết bạn</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions && suggestions.length > 0 ? (
                            suggestions.map(user => (
                                <div key={user.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3a3b3c', padding: '8px', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <img src={user.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{user.username}</span>
                                    </div>
                                    <button onClick={() => { if (!currentUser) return alert("Vui lòng đăng nhập!"); handleSendRequest(user.user_id || user.id); }} style={{ background: '#0084ff', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Thêm bạn</button>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>Không có gợi ý nào</p>
                        )}
                    </div>
                </div>
            </div>

            {/* GÓC DƯỚI BÊN PHẢI (Trò chuyện) */}
            {/* GÓC DƯỚI BÊN PHẢI (Trò chuyện tổng) */}
            {currentUser && (
                <div className="chat-bottom-right" style={{ position: 'fixed', bottom: '70px', right: '15px', width: '280px', zIndex: 99998 }}>
                    <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', boxShadow: '0 2px 15px rgba(0,0,0,0.6)' }}>
                        <div
                            onClick={() => setIsChatExpanded(!isChatExpanded)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <h3 style={{ fontSize: '15px', margin: 0 }}>💬 Trò chuyện</h3>
                            <span style={{ fontSize: '12px' }}>{isChatExpanded ? '▼' : '▲'}</span>
                        </div>

                        {isChatExpanded && (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                                {conversations && conversations.length > 0 ? (
                                    conversations.map(u => (
                                        <div key={u.user_id} onClick={() => { localStorage.setItem('activeChatUser', JSON.stringify({ user_id: u.user_id, username: u.username })); window.dispatchEvent(new Event('open-chat')); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '6px', background: '#3a3b3c' }}>
                                            <img src={u.profile_photo_url || 'https://via.placeholder.com/30'} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                            <span style={{ fontSize: '13px' }}>{u.username}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>Chưa có trò chuyện</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}