import React, { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';
import { Plus, X, Users, UserPlus, Image as ImageIcon, Eye } from 'lucide-react';

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
    const mediaUrl = (url) => url?.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;

    const [suggestions, setSuggestions] = useState([]);
    const [stories, setStories] = useState([]);
    const [storyFile, setStoryFile] = useState(null);
    const [storySticker, setStorySticker] = useState('');
    const [activeStory, setActiveStory] = useState(null);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [showCreatePost, setShowCreatePost] = useState(false);

    const fetchSuggestions = async () => {
        const currentId = currentUser?.user_id || currentUser?.id || 'guest';
        try {
            const res = await fetch(`${API_URL}/suggestions/${currentId}`);
            if (res.ok) setSuggestions(await res.json());
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
            if (res.ok) {
                alert("Đã gửi yêu cầu kết bạn!");
                fetchSuggestions();
            } else {
                alert("Lỗi máy chủ khi gửi kết bạn.");
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="app-shell">
            <div className="app-layout">
                {/* CỘT TRÁI: THANH ĐIỀU HƯỚNG */}
                <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

                {/* CỘT GIỮA: BẢNG TIN TRUNG TÂM */}
                <main className="app-feed-col">
                    {/* BĂNG CHUYỀN STORIES */}
                    <section className="story-bar-container">
                        <div className="story-scroll-track no-scrollbar">
                            {/* Nút đăng story của người dùng */}
                            {currentUser && (
                                <form onSubmit={handleCreateStory} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label htmlFor="story-upload" className="story-card-item">
                                        <div className="story-avatar-wrapper" style={{ background: 'var(--border-hover)' }}>
                                            <div className="story-avatar-inner">
                                                <Avatar user={currentUser} size={54} />
                                            </div>
                                            <span className="story-add-badge">
                                                <Plus size={12} strokeWidth={3} />
                                            </span>
                                        </div>
                                        <span className="story-username-label">Tạo Story</span>
                                    </label>
                                    <input
                                        id="story-upload"
                                        type="file"
                                        accept="image/*,video/*"
                                        hidden
                                        onChange={(e) => setStoryFile(e.target.files?.[0] || null)}
                                    />

                                    {/* Modal xác nhận đăng story */}
                                    {storyFile && (
                                        <div className="modal-backdrop" onClick={() => setStoryFile(null)}>
                                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                                                <div className="modal-header">
                                                    <h2>Tạo Story mới</h2>
                                                    <button type="button" className="close-btn" onClick={() => setStoryFile(null)}>
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div style={{ padding: '20px' }}>
                                                    <input
                                                        value={storySticker}
                                                        onChange={e => setStorySticker(e.target.value)}
                                                        placeholder="Thêm nhãn dán sticker (ví dụ: 🎉, 🔥)..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 14px',
                                                            borderRadius: '10px',
                                                            border: '1px solid var(--border-subtle)',
                                                            background: 'var(--bg-input)',
                                                            color: 'var(--text-primary)',
                                                            marginBottom: '16px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <button
                                                        type="submit"
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            background: 'var(--accent-gradient)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Chia sẻ lên Story
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Danh sách story của bạn bè */}
                            {stories.map(story => (
                                <button
                                    key={story.story_id}
                                    type="button"
                                    onClick={() => handleOpenStory(story)}
                                    className="story-card-item"
                                >
                                    <div className="story-avatar-wrapper">
                                        <div className="story-avatar-inner">
                                            <img
                                                src={story.profile_photo_url || 'https://picsum.photos/60'}
                                                alt={story.username}
                                            />
                                        </div>
                                    </div>
                                    <span className="story-username-label">{story.username}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* STORY VIEWER FULLSCREEN */}
                    {activeStory && (
                        <div className="story-viewer-backdrop" onClick={() => setActiveStory(null)}>
                            <div className="story-viewer" onClick={e => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="story-close-button"
                                    onClick={() => setActiveStory(null)}
                                    aria-label="Đóng Story"
                                >
                                    <X size={20} />
                                </button>
                                <div className="story-viewer-user">
                                    <Avatar user={{ username: activeStory.username, profile_photo_url: activeStory.profile_photo_url }} size={36} />
                                    <strong>{activeStory.username}</strong>
                                </div>
                                {activeStory.media_type === 'video'
                                    ? <video src={mediaUrl(activeStory.media_url)} controls autoPlay />
                                    : <img src={mediaUrl(activeStory.media_url)} alt={`Story của ${activeStory.username}`} />}
                                {activeStory.sticker && <div className="story-sticker">{activeStory.sticker}</div>}
                                <div className="story-reactions" onClick={e => e.stopPropagation()}>
                                    {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(reaction => (
                                        <button
                                            type="button"
                                            key={reaction}
                                            className={selectedReaction === reaction ? 'selected' : ''}
                                            onClick={() => handleReactToStory(reaction)}
                                            aria-label={`Thả ${reaction}`}
                                        >
                                            {reaction}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {Number(activeStory.user_id) === Number(currentUser?.user_id) && (
                                <div className="story-view-count">
                                    <Eye size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    {activeStory.view_count || 0} lượt xem
                                </div>
                            )}
                        </div>
                    )}

                    {/* KHUNG TẠO BÀI VIẾT NHANH TRÊN FEED */}
                    {currentUser && (
                        <div className="create-post-trigger-card">
                            <div className="create-post-top-row">
                                <Avatar user={currentUser} size={42} />
                                <div
                                    className="create-post-input-mock"
                                    onClick={() => setShowCreatePost(true)}
                                >
                                    Bạn đang nghĩ gì thế, {currentUser.username}?
                                </div>
                            </div>
                            <div className="create-post-actions-row">
                                <button
                                    type="button"
                                    className="create-post-action-btn"
                                    onClick={() => setShowCreatePost(true)}
                                >
                                    <ImageIcon size={18} color="#10b981" />
                                    <span>Ảnh / Video</span>
                                </button>
                                <button
                                    type="button"
                                    className="create-post-action-btn"
                                    onClick={() => setShowCreatePost(true)}
                                >
                                    <Plus size={18} color="#3b82f6" />
                                    <span>Đăng bài</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODAL ĐĂNG BÀI ĐẦY ĐỦ */}
                    {showCreatePost && currentUser && (
                        <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Tạo bài viết</h2>
                                    <button type="button" className="close-btn" onClick={() => setShowCreatePost(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <CreatePost
                                    onPostCreated={() => {
                                        onPostCreated();
                                        setShowCreatePost(false);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* DANH SÁCH BÀI VIẾT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '48px 24px',
                                textAlign: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                <p style={{ fontSize: '15px' }}>Chưa có bài viết nào trong bảng tin.</p>
                                <p style={{ fontSize: '13px', marginTop: '6px' }}>Hãy theo dõi bạn bè hoặc đăng bài viết đầu tiên!</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* CỘT PHẢI: GỢI Ý KẾT BẠN & TIỆN ÍCH */}
                <aside className="app-widget-col">
                    <div className="widget-card">
                        <div className="widget-title">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} color="#60a5fa" />
                                Gợi ý kết bạn
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {suggestions && suggestions.length > 0 ? (
                                suggestions.map(user => (
                                    <div key={user.user_id} className="suggestion-user-row">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                            className="suggestion-user-meta"
                                            title={`Xem trang của ${user.username}`}
                                        >
                                            <Avatar user={user} size={36} />
                                            <div>
                                                <div className="suggestion-username">{user.username}</div>
                                                <div className="suggestion-subtitle">Gợi ý cho bạn</div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!currentUser) return alert("Vui lòng đăng nhập!");
                                                handleSendRequest(user.user_id || user.id);
                                            }}
                                            className="btn-connect-user"
                                            title="Thêm bạn bè"
                                        >
                                            <UserPlus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            Kết bạn
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                                    Không có gợi ý mới
                                </p>
                            )}
                        </div>
                    </div>
                </aside>

                <ChatWidget />
            </div>
        </div>
    );
}