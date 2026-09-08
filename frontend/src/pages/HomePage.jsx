import React, { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';

const parseJsonValue = value => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
    const mediaUrl = (url) => url?.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;

    const [conversations, setConversations] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [stories, setStories] = useState([]);
    const [storyFile, setStoryFile] = useState(null);
    const [storySticker, setStorySticker] = useState('');
    const [activeStory, setActiveStory] = useState(null);
    const [selectedReaction, setSelectedReaction] = useState(null);
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

    const fetchStories = async () => {
        try {
            const viewerId = currentUser?.user_id || '';
            const res = await fetch(`${API_URL}/stories?userId=${viewerId}`);
            if (res.ok) {
                const data = await res.json();
                setStories(data.map(story => ({
                    ...story,
                    poll: null
                })));
            }
        } catch (err) { console.error('Lỗi tải story:', err); }
    };

    useEffect(() => {
        fetchSuggestions();
        fetchStories();
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

    const handleCreateStory = async (event) => {
        event.preventDefault();
        if (!currentUser || !storyFile) return;
        const formData = new FormData();
        formData.append('user_id', currentUser.user_id);
        formData.append('storyMedia', storyFile);
        if (storySticker.trim()) formData.append('sticker', storySticker.trim());
        const response = await fetch(`${API_URL}/stories`, { method: 'POST', body: formData });
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Không thể đăng story.');
            return;
        }
        setStoryFile(null);
        setStorySticker('');
        event.target.reset();
        fetchStories();
    };

    const handleOpenStory = async (story) => {
        setActiveStory({
            ...story,
            poll: null
        });
        setSelectedReaction(null);
        if (currentUser?.user_id && Number(currentUser.user_id) !== Number(story.user_id)) {
            await fetch(`${API_URL}/stories/${story.story_id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id })
            });
        }
    };

    const handleReactToStory = async reaction => {
        if (!currentUser?.user_id || !activeStory) {
            alert('Vui lòng đăng nhập để thả reaction.');
            return;
        }
        const response = await fetch(`${API_URL}/stories/${activeStory.story_id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.user_id, reaction })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Không thể thả reaction.');
            return;
        }
        setSelectedReaction(data.reaction);
    };

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
            <section style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '10px 0 18px', marginBottom: '12px' }}>
                {currentUser && (
                    <form onSubmit={handleCreateStory} style={{ minWidth: '76px', textAlign: 'center' }}>
                        <label htmlFor="story-upload" style={{ cursor: 'pointer' }}>
                            <span style={{ display: 'grid', placeItems: 'center', width: '58px', height: '58px', borderRadius: '50%', border: '2px dashed #888', color: '#aaa', fontSize: '24px' }}>+</span>
                            <small>Story của bạn</small>
                        </label>
                        <input id="story-upload" type="file" accept="image/*,video/*" hidden onChange={(e) => setStoryFile(e.target.files?.[0] || null)} />
                        {storyFile && (
                            <div style={{ position: 'fixed', inset: 0, zIndex: 120000, background: 'rgba(0,0,0,.85)', display: 'grid', placeItems: 'center' }} onClick={() => setStoryFile(null)}>
                                <div onClick={e => e.stopPropagation()} style={{ width: 'min(420px, 92vw)', background: '#242526', padding: 20, borderRadius: 10, textAlign: 'left' }}>
                                    <h3 style={{ marginBottom: 12 }}>Tùy chỉnh story</h3>
                                    <input value={storySticker} onChange={e => setStorySticker(e.target.value)} placeholder="Sticker (ví dụ: 🎉)" style={{ width: '100%', marginBottom: 8, padding: 8 }} />
                                    <button type="submit" style={{ width: '100%', padding: 10, background: '#0095f6', color: 'white', border: 0, borderRadius: 6 }}>Đăng story</button>
                                </div>
                            </div>
                        )}
                    </form>
                )}
                {stories.map(story => (
                    <button key={story.story_id} type="button" onClick={() => handleOpenStory(story)} style={{ minWidth: '76px', border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}>
                        <img src={story.profile_photo_url || 'https://via.placeholder.com/60'} alt={story.username} style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e1306c', padding: '2px' }} />
                        <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{story.username}</small>
                    </button>
                ))}
            </section>
            {activeStory && (
                <div className="story-viewer-backdrop" onClick={() => setActiveStory(null)}>
                    <div className="story-viewer" onClick={e => e.stopPropagation()}>
                        <button type="button" className="story-close-button" onClick={() => setActiveStory(null)} aria-label="Đóng Story">×</button>
                        <div className="story-viewer-user">
                            <img src={activeStory.profile_photo_url} alt="" />
                            <strong>{activeStory.username}</strong>
                        </div>
                        {activeStory.media_type === 'video'
                            ? <video src={mediaUrl(activeStory.media_url)} controls autoPlay />
                            : <img src={mediaUrl(activeStory.media_url)} alt={`Story của ${activeStory.username}`} />}
                        {activeStory.sticker && <div className="story-sticker">{activeStory.sticker}</div>}
                        <div className="story-reactions" onClick={e => e.stopPropagation()}>
                            {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(reaction => (
                                <button type="button" key={reaction} className={selectedReaction === reaction ? 'selected' : ''} onClick={() => handleReactToStory(reaction)} aria-label={`Thả ${reaction}`}>
                                    {reaction}
                                </button>
                            ))}
                        </div>
                    </div>
                    {Number(activeStory.user_id) === Number(currentUser?.user_id) && (
                        <div className="story-view-count">
                            👁 {activeStory.view_count || 0} lượt xem
                        </div>
                    )}
                </div>
            )}

            {/* POPUP ĐĂNG BÀI */}
            {showCreatePost && currentUser && (
                <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 120000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowCreatePost(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: '#242526', padding: '20px', borderRadius: '10px', zIndex: 120001,
                    }}>
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

            {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG (Gồm Đăng nhập / Đăng xuất) */}
            <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

            {/* THANH BÊN PHẢI (Gợi ý kết bạn) */}
            <div className="home-right-sidebar" style={{ position: 'fixed', top: '20px', right: '140px', width: '280px', zIndex: 100 }}>
                <div style={{ background: '#242526', padding: '15px', borderRadius: '8px', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>👥 Gợi ý kết bạn</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions && suggestions.length > 0 ? (
                            suggestions.map(user => (
                                <div key={user.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3a3b3c', padding: '8px', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                            title={`Xem trang cá nhân của ${user.username}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 0, border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', overflow: 'hidden' }}
                                        >
                                            <Avatar user={user} className="suggestion-avatar" />
                                            <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{user.username}</span>
                                        </button>
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

            <ChatWidget />
        </div>
    );
}