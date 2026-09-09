import { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';
import {
    Plus,
    X,
    Users,
    UserPlus,
    Image as ImageIcon,
    Eye,
    MoreVertical,
    Pencil,
    Trash2,
    Music2,
    Search,
    ChevronDown,
    ChevronUp,
    Play,
    Pause,
    FileText
} from 'lucide-react';

export default function HomePage({ posts, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
    const mediaUrl = (url) => url?.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;

    const [suggestions, setSuggestions] = useState([]);
    const [stories, setStories] = useState([]);
    const [storyFile, setStoryFile] = useState(null);
    const [storyMusic, setStoryMusic] = useState(null);
    const [spotifyQuery, setSpotifyQuery] = useState('');
    const [spotifyResults, setSpotifyResults] = useState([]);
    const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);
    const [isSpotifySearching, setIsSpotifySearching] = useState(false);
    const [musicSearchError, setMusicSearchError] = useState('');
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const [previewAudio, setPreviewAudio] = useState(null);
    const [storySticker, setStorySticker] = useState('');
    const [activeStory, setActiveStory] = useState(null);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [storyMenuOpen, setStoryMenuOpen] = useState(false);
    const [editingStory, setEditingStory] = useState(null);
    const [storyEditFile, setStoryEditFile] = useState(null);
    const [storyEditMusic, setStoryEditMusic] = useState(null);
    const [removeStoryMusic, setRemoveStoryMusic] = useState(false);
    const [removeSpotifyMusic, setRemoveSpotifyMusic] = useState(false);
    const [storyEditSticker, setStoryEditSticker] = useState('');
    const [selectedStoryPost, setSelectedStoryPost] = useState(null);
    const [showPostPicker, setShowPostPicker] = useState(false);
    const [showPostDropdown, setShowPostDropdown] = useState(false);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [postPickerQuery, setPostPickerQuery] = useState('');
    const [isSharingPost, setIsSharingPost] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);

    // Phát/dừng nghe thử bài hát 30s
    const togglePlayPreview = (track, e) => {
        if (e) e.stopPropagation();
        if (!track.previewUrl) return;
        if (playingTrackId === track.id) {
            if (previewAudio) previewAudio.pause();
            setPlayingTrackId(null);
            setPreviewAudio(null);
            return;
        }
        if (previewAudio) previewAudio.pause();
        const audio = new Audio(track.previewUrl);
        audio.play().catch(() => {});
        audio.onended = () => {
            setPlayingTrackId(null);
            setPreviewAudio(null);
        };
        setPreviewAudio(audio);
        setPlayingTrackId(track.id);
    };

    // Dọn dẹp audio nghe thử khi component unmount
    useEffect(() => {
        return () => {
            if (previewAudio) previewAudio.pause();
        };
    }, [previewAudio]);

    // Lắng nghe sự kiện chia sẻ bài viết lên Story từ PostCard
    useEffect(() => {
        const handleOpenStoryWithPost = (e) => {
            const postToShare = e.detail;
            if (postToShare) {
                setSelectedStoryPost(postToShare);
                setIsCreateStoryOpen(true);
                setShowPostDropdown(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('open-story-with-post', handleOpenStoryWithPost);
        return () => window.removeEventListener('open-story-with-post', handleOpenStoryWithPost);
    }, []);

    const searchSpotify = async () => {
        if (spotifyQuery.trim().length < 2) return;
        setIsSpotifySearching(true);
        setMusicSearchError('');
        try {
            const response = await fetch(`${API_URL}/spotify/search?q=${encodeURIComponent(spotifyQuery.trim())}`);
            const data = await response.json();
            if (!response.ok) {
                setMusicSearchError(data.message || 'Không thể tìm bài hát.');
                setSpotifyResults([]);
                return;
            }
            const tracks = data.tracks || [];
            setSpotifyResults(tracks);
            if (tracks.length === 0) {
                setMusicSearchError(data.message || 'Không tìm thấy bài hát phù hợp.');
            }
        } catch (error) {
            console.error('Lỗi tìm nhạc:', error);
            setSpotifyResults([]);
            setMusicSearchError('Không thể kết nối tìm kiếm nhạc.');
        } finally {
            setIsSpotifySearching(false);
        }
    };

    const sharePostToStory = async () => {
        if (!currentUser || !selectedStoryPost) return;

        setIsSharingPost(true);
        const formData = new FormData();
        formData.append('user_id', currentUser.user_id);
        formData.append('shared_post_id', selectedStoryPost.id);

        try {
            const response = await fetch(`${API_URL}/stories`, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Không thể chia sẻ bài viết lên Story.');
            setSelectedStoryPost(null);
            setPostPickerQuery('');
            setShowPostPicker(false);
            fetchStories();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSharingPost(false);
        }
    };

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

    const handleCloseStoryModal = () => {
        if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
            setPlayingTrackId(null);
        }
        setIsCreateStoryOpen(false);
        setStoryFile(null);
        setStoryMusic(null);
        setSpotifyQuery('');
        setSpotifyResults([]);
        setMusicSearchError('');
        setSelectedSpotifyTrack(null);
        setStorySticker('');
        setSelectedStoryPost(null);
        setShowPostDropdown(false);
        setShowPostPicker(false);
    };

    const handleCreateStory = async (event) => {
        event.preventDefault();
        if (!currentUser || (!storyFile && !selectedStoryPost)) return;
        const formData = new FormData();
        formData.append('user_id', currentUser.user_id);
        if (storyFile) formData.append('storyMedia', storyFile);
        if (selectedStoryPost) formData.append('shared_post_id', selectedStoryPost.id || selectedStoryPost.post_id);
        if (storyMusic) formData.append('storyMusic', storyMusic);
        if (selectedSpotifyTrack) {
            formData.append('spotify_track_id', selectedSpotifyTrack.id);
            formData.append('spotify_track_name', selectedSpotifyTrack.name);
            formData.append('spotify_artist_name', selectedSpotifyTrack.artists);
            formData.append('spotify_external_url', selectedSpotifyTrack.externalUrl || '');
            if (selectedSpotifyTrack.previewUrl) {
                formData.append('music_url', selectedSpotifyTrack.previewUrl);
                formData.append('music_name', `${selectedSpotifyTrack.name} - ${selectedSpotifyTrack.artists}`);
            }
        }
        if (storySticker.trim()) formData.append('sticker', storySticker.trim());
        try {
            const response = await fetch(`${API_URL}/stories`, { method: 'POST', body: formData });
            if (!response.ok) {
                const data = await response.json();
                alert(data.message || 'Không thể đăng story.');
                return;
            }
            handleCloseStoryModal();
            fetchStories();
        } catch (err) {
            console.error('Lỗi khi đăng story:', err);
            alert('Không thể kết nối đến máy chủ.');
        }
    };

    const handleOpenStory = async (story) => {
        setActiveStory({
            ...story,
            poll: null
        });
        setSelectedReaction(null);
        setStoryMenuOpen(false);
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

    const handleStartEditStory = () => {
        setEditingStory(activeStory);
        setStoryEditSticker(activeStory?.sticker || '');
        setStoryEditFile(null);
        setStoryEditMusic(null);
        setRemoveStoryMusic(false);
        setRemoveSpotifyMusic(false);
        setSelectedSpotifyTrack(activeStory?.spotify_track_id ? {
            id: activeStory.spotify_track_id,
            name: activeStory.spotify_track_name,
            artists: activeStory.spotify_artist_name,
            externalUrl: activeStory.spotify_external_url
        } : null);
        setStoryMenuOpen(false);
        setActiveStory(null);
    };

    const handleUpdateStory = async event => {
        event.preventDefault();
        if (!currentUser || !editingStory) return;
        const formData = new FormData();
        formData.append('user_id', currentUser.user_id);
        formData.append('sticker', storyEditSticker);
        if (storyEditFile) formData.append('storyMedia', storyEditFile);
        if (storyEditMusic) formData.append('storyMusic', storyEditMusic);
        if (removeStoryMusic) formData.append('removeMusic', 'true');
        if (removeSpotifyMusic) formData.append('removeSpotifyMusic', 'true');
        if (selectedSpotifyTrack) {
            formData.append('spotify_track_id', selectedSpotifyTrack.id);
            formData.append('spotify_track_name', selectedSpotifyTrack.name);
            formData.append('spotify_artist_name', selectedSpotifyTrack.artists);
            formData.append('spotify_external_url', selectedSpotifyTrack.externalUrl || '');
        }

        try {
            const response = await fetch(`${API_URL}/stories/${editingStory.story_id}`, {
                method: 'PATCH',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || 'Không thể sửa story.');
                return;
            }
            setStories(prev => prev.map(story => (
                story.story_id === data.story_id ? { ...story, ...data } : story
            )));
            setEditingStory(null);
            setStoryEditFile(null);
            setStoryEditMusic(null);
            setRemoveStoryMusic(false);
            setSelectedSpotifyTrack(null);
            setSpotifyQuery('');
            setSpotifyResults([]);
            setStoryEditSticker('');
        } catch (err) {
            console.error('Lỗi sửa story:', err);
            alert('Không thể kết nối đến máy chủ.');
        }
    };

    const handleDeleteStory = async () => {
        if (!activeStory || !currentUser) return;
        if (!window.confirm('Bạn có chắc muốn xóa story này không?')) return;
        try {
            const response = await fetch(`${API_URL}/stories/${activeStory.story_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || 'Không thể xóa story.');
                return;
            }
            setStories(prev => prev.filter(story => story.story_id !== activeStory.story_id));
            setActiveStory(null);
            setStoryMenuOpen(false);
        } catch (err) {
            console.error('Lỗi xóa story:', err);
            alert('Không thể kết nối đến máy chủ.');
        }
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

    const postPickerResults = (posts || [])
        .filter(post => {
            const query = postPickerQuery.trim().toLowerCase();
            if (!query) return true;
            return `${post.author || ''} ${post.content || ''}`.toLowerCase().includes(query);
        })
        .slice(0, 30);

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
                                <>
                                    <div
                                        className="story-card-item"
                                        onClick={() => {
                                            setIsCreateStoryOpen(true);
                                            setShowPostDropdown(false);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                        title="Tạo Story mới"
                                    >
                                        <div className="story-avatar-wrapper" style={{ background: 'var(--border-hover)' }}>
                                            <div className="story-avatar-inner">
                                                <Avatar user={currentUser} size={54} />
                                            </div>
                                            <span className="story-add-badge">
                                                <Plus size={12} strokeWidth={3} />
                                            </span>
                                        </div>
                                        <span className="story-username-label">Tạo Story</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="story-share-post-button"
                                        onClick={() => {
                                            setIsCreateStoryOpen(true);
                                            setShowPostDropdown(true);
                                        }}
                                        title="Chọn bài viết để chia sẻ lên Story"
                                    >
                                        <ImageIcon size={22} />
                                        <span>Chia sẻ bài viết</span>
                                    </button>
                                </>
                            )}

                            {/* Modal Tạo Story Mới / Chia Sẻ Bài Viết Lên Story */}
                            {(isCreateStoryOpen || storyFile || selectedStoryPost) && currentUser && (
                                <div className="modal-backdrop" onClick={handleCloseStoryModal}>
                                    <div
                                        className="modal-content story-create-modal"
                                        onClick={e => e.stopPropagation()}
                                        style={{ maxWidth: '480px', width: '92%' }}
                                    >
                                        <div className="modal-header">
                                            <h2>Tạo Story mới</h2>
                                            <button type="button" className="close-btn" onClick={handleCloseStoryModal} aria-label="Đóng">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleCreateStory} className="story-create-body">
                                            {/* 1. SỔ BÀI VIẾT ĐỂ CHỌN CHIA SẺ */}
                                            <div className="story-section-box">
                                                <button
                                                    type="button"
                                                    className="story-section-header-btn"
                                                    onClick={() => setShowPostDropdown(!showPostDropdown)}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FileText size={16} color={selectedStoryPost ? 'var(--accent-primary, #0095f6)' : 'currentColor'} />
                                                        {selectedStoryPost
                                                            ? `Đã chọn bài của @${selectedStoryPost.author}`
                                                            : 'Chọn bài viết để chia sẻ lên Story'}
                                                    </span>
                                                    {showPostDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>

                                                {/* Thẻ xem trước bài viết đã chọn */}
                                                {selectedStoryPost && (
                                                    <div className="story-selected-post-preview">
                                                        {selectedStoryPost.imageUrl && (
                                                            <img src={mediaUrl(selectedStoryPost.imageUrl)} alt="" />
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <strong style={{ fontSize: '13px', display: 'block' }}>@{selectedStoryPost.author}</strong>
                                                            <small style={{ color: 'var(--text-muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {selectedStoryPost.content || 'Bài viết hình ảnh'}
                                                            </small>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStoryPost(null)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Bỏ chọn
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Danh sách bài viết sổ ra khi bấm mở */}
                                                {showPostDropdown && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                                        <input
                                                            value={postPickerQuery}
                                                            onChange={e => setPostPickerQuery(e.target.value)}
                                                            placeholder="Tìm theo người đăng hoặc nội dung bài viết..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '9px 12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--border-subtle)',
                                                                background: 'var(--bg-input)',
                                                                color: 'var(--text-primary)',
                                                                fontSize: '13px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <div className="story-post-picker-list no-scrollbar" style={{ maxHeight: '200px' }}>
                                                            {postPickerResults.length === 0 ? (
                                                                <p className="story-post-picker-empty">Không có bài viết nào phù hợp.</p>
                                                            ) : (
                                                                postPickerResults.map(p => {
                                                                    const pId = p.id || p.post_id;
                                                                    const isSelected = (selectedStoryPost?.id || selectedStoryPost?.post_id) === pId;
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            key={pId}
                                                                            className={`story-post-option ${isSelected ? 'selected' : ''}`}
                                                                            onClick={() => {
                                                                                setSelectedStoryPost(p);
                                                                                setShowPostDropdown(false);
                                                                            }}
                                                                        >
                                                                            {p.imageUrl && <img src={mediaUrl(p.imageUrl)} alt="" />}
                                                                            <span>
                                                                                <strong>@{p.author || 'Người dùng'}</strong>
                                                                                <small>{p.content || 'Bài viết hình ảnh'}</small>
                                                                            </span>
                                                                            {isSelected && <span className="story-post-check">Đã chọn</span>}
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. TẢI ẢNH HOẶC VIDEO */}
                                            <div className="story-section-box">
                                                {storyFile ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        {storyFile.type.startsWith('video/') ? (
                                                            <video src={URL.createObjectURL(storyFile)} controls style={{ maxHeight: '180px', borderRadius: '8px', width: '100%' }} />
                                                        ) : (
                                                            <img src={URL.createObjectURL(storyFile)} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'contain', width: '100%' }} />
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setStoryFile(null)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                fontSize: '12.5px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Xóa tệp ảnh/video
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px dashed var(--border-subtle)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        <ImageIcon size={18} />
                                                        <span>{selectedStoryPost ? 'Thêm ảnh/video nền (tùy chọn)' : 'Chọn ảnh hoặc video từ máy'}</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*,video/*"
                                                            hidden
                                                            onChange={e => setStoryFile(e.target.files?.[0] || null)}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {/* 3. NHÃN DÁN STICKER */}
                                            <input
                                                value={storySticker}
                                                onChange={e => setStorySticker(e.target.value)}
                                                placeholder="Thêm nhãn dán sticker (ví dụ: 🎉, 🔥, ❤️)..."
                                                style={{
                                                    width: '100%',
                                                    padding: '11px 13px',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--border-subtle)',
                                                    background: 'var(--bg-input)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    fontSize: '13.5px'
                                                }}
                                            />

                                            {/* 4. CHỌN NHẠC (SPOTIFY & APPLE MUSIC & MP3) */}
                                            <div className="spotify-picker" style={{ margin: 0 }}>
                                                <div className="spotify-picker-title">
                                                    <Music2 size={16} /> Chọn nhạc nền Story
                                                </div>
                                                <div className="spotify-search-row">
                                                    <input
                                                        value={spotifyQuery}
                                                        onChange={e => setSpotifyQuery(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchSpotify())}
                                                        placeholder="Tìm bài hát hoặc ca sĩ (VD: em của, sơn tùng)..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={searchSpotify}
                                                        disabled={isSpotifySearching}
                                                        aria-label="Tìm nhạc"
                                                    >
                                                        <Search size={16} />
                                                    </button>
                                                </div>

                                                {/* Thông báo trạng thái tìm nhạc */}
                                                {isSpotifySearching && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                                                        Đang tìm kiếm bài hát...
                                                    </p>
                                                )}
                                                {musicSearchError && (
                                                    <p style={{ color: '#fca5a5', fontSize: '12.5px', marginTop: '6px' }}>
                                                        {musicSearchError}
                                                    </p>
                                                )}

                                                {/* Bài hát đã chọn */}
                                                {selectedSpotifyTrack && (
                                                    <div className="spotify-selected-track" style={{ marginTop: '8px' }}>
                                                        <span style={{ fontSize: '13px' }}>
                                                            🎵 {selectedSpotifyTrack.name} - {selectedSpotifyTrack.artists}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (previewAudio) previewAudio.pause();
                                                                setSelectedSpotifyTrack(null);
                                                                setPlayingTrackId(null);
                                                            }}
                                                        >
                                                            Bỏ chọn
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Kết quả tìm nhạc có nút nghe thử 30s */}
                                                {spotifyResults.length > 0 && (
                                                    <div className="spotify-results no-scrollbar" style={{ maxHeight: '180px', marginTop: '8px' }}>
                                                        {spotifyResults.map(track => {
                                                            const isPlaying = playingTrackId === track.id;
                                                            return (
                                                                <div
                                                                    key={track.id}
                                                                    className="story-track-item"
                                                                    onClick={() => {
                                                                        setSelectedSpotifyTrack(track);
                                                                        setSpotifyResults([]);
                                                                        setMusicSearchError('');
                                                                    }}
                                                                >
                                                                    {track.imageUrl && (
                                                                        <img src={track.imageUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                                                    )}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {track.name}
                                                                        </strong>
                                                                        <small style={{ color: 'var(--text-muted)', fontSize: '11.5px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {track.artists}
                                                                        </small>
                                                                    </div>
                                                                    {track.previewUrl && (
                                                                        <button
                                                                            type="button"
                                                                            className="story-track-play-btn"
                                                                            onClick={e => togglePlayPreview(track, e)}
                                                                            title={isPlaying ? 'Dừng nghe thử' : 'Nghe thử 30s'}
                                                                        >
                                                                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Tải tệp MP3 thủ công */}
                                                <label className="story-music-picker" style={{ marginTop: '10px' }}>
                                                    <Music2 size={16} />
                                                    {storyMusic ? storyMusic.name : 'Hoặc tải tệp MP3 từ máy'}
                                                    <input
                                                        type="file"
                                                        accept="audio/mpeg,.mp3"
                                                        onChange={e => setStoryMusic(e.target.files?.[0] || null)}
                                                    />
                                                </label>
                                            </div>

                                            {/* NÚT ĐĂNG STORY */}
                                            <button
                                                type="submit"
                                                disabled={!storyFile && !selectedStoryPost}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: (!storyFile && !selectedStoryPost) ? 'var(--bg-elevated, #262626)' : 'var(--accent-gradient, #0095f6)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    cursor: (!storyFile && !selectedStoryPost) ? 'not-allowed' : 'pointer',
                                                    opacity: (!storyFile && !selectedStoryPost) ? 0.6 : 1,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Chia sẻ lên Story
                                            </button>
                                        </form>
                                    </div>
                                </div>
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
                                {Number(activeStory.user_id) === Number(currentUser?.user_id) && (
                                    <div className="story-owner-actions">
                                        <button
                                            type="button"
                                            className="story-more-button"
                                            onClick={() => setStoryMenuOpen(prev => !prev)}
                                            aria-label="Tùy chọn Story"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {storyMenuOpen && (
                                            <div className="story-action-menu">
                                                <button type="button" onClick={handleStartEditStory}>
                                                    <Pencil size={15} /> Sửa story
                                                </button>
                                                <button type="button" className="danger" onClick={handleDeleteStory}>
                                                    <Trash2 size={15} /> Xóa story
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="story-viewer-user">
                                    <Avatar user={{ username: activeStory.username, profile_photo_url: activeStory.profile_photo_url }} size={36} />
                                    <strong>{activeStory.username}</strong>
                                </div>
                                {activeStory.shared_post ? (
                                    <button
                                        type="button"
                                        className="story-shared-post"
                                        onClick={() => navigate(`/post/${activeStory.shared_post.post_id}`)}
                                    >
                                        {activeStory.shared_post.photo_url && (
                                            <img
                                                src={mediaUrl(activeStory.shared_post.photo_url)}
                                                alt="Ảnh bài viết được chia sẻ"
                                            />
                                        )}
                                        <div className="story-shared-post-content">
                                            <strong>@{activeStory.shared_post.username}</strong>
                                            <p>{activeStory.shared_post.caption || 'Bài viết hình ảnh'}</p>
                                            <small>Nhấn để xem bài viết</small>
                                        </div>
                                    </button>
                                ) : activeStory.media_type === 'video'
                                    ? <video src={mediaUrl(activeStory.media_url)} controls autoPlay />
                                    : <img src={mediaUrl(activeStory.media_url)} alt={`Story của ${activeStory.username}`} />}
                                {activeStory.sticker && <div className="story-sticker">{activeStory.sticker}</div>}
                                {activeStory.music_url && (
                                    <div className="story-music-player" onClick={e => e.stopPropagation()}>
                                        <Music2 size={15} />
                                        <span>{activeStory.music_name || 'Nhạc Story'}</span>
                                        <audio src={mediaUrl(activeStory.music_url)} controls autoPlay loop />
                                    </div>
                                )}
                                {activeStory.spotify_track_id && (
                                    <div className="spotify-embed-player" onClick={e => e.stopPropagation()}>
                                        <div className="spotify-track-label">
                                            <Music2 size={15} />
                                            {activeStory.spotify_track_name} - {activeStory.spotify_artist_name}
                                        </div>
                                        <iframe
                                            title={`Spotify: ${activeStory.spotify_track_name}`}
                                            src={`https://open.spotify.com/embed/track/${activeStory.spotify_track_id}?utm_source=generator&theme=0`}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
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

                    {editingStory && (
                        <div className="modal-backdrop" onClick={() => setEditingStory(null)}>
                            <form className="modal-content story-edit-modal" onSubmit={handleUpdateStory} onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Chỉnh sửa Story</h2>
                                    <button type="button" className="close-btn" onClick={() => setEditingStory(null)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="story-edit-body">
                                    <div className="story-edit-preview">
                                        {editingStory.shared_post ? (
                                            <div className="story-shared-post story-shared-post-preview">
                                                {editingStory.shared_post.photo_url && (
                                                    <img
                                                        src={mediaUrl(editingStory.shared_post.photo_url)}
                                                        alt="Bài viết được chia sẻ"
                                                    />
                                                )}
                                                <div className="story-shared-post-content">
                                                    <strong>@{editingStory.shared_post.username}</strong>
                                                    <p>{editingStory.shared_post.caption || 'Bài viết hình ảnh'}</p>
                                                </div>
                                            </div>
                                        ) : storyEditFile
                                            ? (storyEditFile.type.startsWith('video/')
                                                ? <video src={URL.createObjectURL(storyEditFile)} controls />
                                                : <img src={URL.createObjectURL(storyEditFile)} alt="Xem trước story mới" />)
                                            : (editingStory.media_type === 'video'
                                                ? <video src={mediaUrl(editingStory.media_url)} controls />
                                                : <img src={mediaUrl(editingStory.media_url)} alt="Story hiện tại" />)}
                                    </div>
                                    <label className="story-edit-upload">
                                        Đổi ảnh hoặc video
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={e => setStoryEditFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                    <label className="story-music-picker">
                                        <Music2 size={17} />
                                        {storyEditMusic ? storyEditMusic.name : 'Đổi nhạc MP3'}
                                        <input
                                            type="file"
                                            accept="audio/mpeg,.mp3"
                                            onChange={e => {
                                                setStoryEditMusic(e.target.files?.[0] || null);
                                                setRemoveStoryMusic(false);
                                            }}
                                        />
                                    </label>
                                    {editingStory.music_url && !storyEditMusic && (
                                        <label className="story-remove-music">
                                            <input
                                                type="checkbox"
                                                checked={removeStoryMusic}
                                                onChange={e => setRemoveStoryMusic(e.target.checked)}
                                            />
                                            Xóa nhạc hiện tại
                                        </label>
                                    )}
                                    <div className="spotify-picker">
                                        <div className="spotify-picker-title"><Music2 size={17} /> Đổi nhạc Spotify</div>
                                        <div className="spotify-search-row">
                                            <input
                                                value={spotifyQuery}
                                                onChange={e => setSpotifyQuery(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchSpotify())}
                                                placeholder="Tìm bài hát hoặc ca sĩ..."
                                            />
                                            <button type="button" onClick={searchSpotify} disabled={isSpotifySearching} aria-label="Tìm nhạc">
                                                <Search size={16} />
                                            </button>
                                        </div>
                                        {selectedSpotifyTrack && (
                                            <div className="spotify-selected-track">
                                                <span>{selectedSpotifyTrack.name} - {selectedSpotifyTrack.artists}</span>
                                                <button type="button" onClick={() => {
                                                    setSelectedSpotifyTrack(null);
                                                    setRemoveSpotifyMusic(true);
                                                }}>Xóa nhạc</button>
                                            </div>
                                        )}
                                        {spotifyResults.length > 0 && (
                                            <div className="spotify-results">
                                                {spotifyResults.map(track => (
                                                    <button type="button" key={track.id} onClick={() => {
                                                        setSelectedSpotifyTrack(track);
                                                        setRemoveSpotifyMusic(false);
                                                        setSpotifyResults([]);
                                                    }}>
                                                        {track.imageUrl && <img src={track.imageUrl} alt="" />}
                                                        <span><strong>{track.name}</strong><small>{track.artists}</small></span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        value={storyEditSticker}
                                        onChange={e => setStoryEditSticker(e.target.value)}
                                        placeholder="Thêm sticker..."
                                        maxLength={100}
                                    />
                                    <button type="submit" className="story-edit-submit">Lưu thay đổi</button>
                                </div>
                            </form>
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