import { useState, useEffect } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';
import { safeFetch } from '../utils/api';
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
    FileText,
    Smile,
    Palette,
    Send
} from 'lucide-react';

const STORY_GRADIENTS = [
    { name: 'Sunset', value: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', colors: ['#f09433', '#dc2743', '#bc1888'] },
    { name: 'Purple', value: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%)', colors: ['#1e1b4b', '#4338ca', '#7c3aed'] },
    { name: 'Cyber', value: 'linear-gradient(135deg, #091e3a 0%, #2563eb 60%, #38bdf8 100%)', colors: ['#091e3a', '#2563eb', '#38bdf8'] },
    { name: 'Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)', colors: ['#064e3b', '#059669', '#34d399'] },
    { name: 'Noir', value: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)', colors: ['#18181b', '#09090b'] }
];

const generateStoryCanvasBlob = async (text, textColor, textBg, gradientColors, sticker) => {
    return new Promise(resolve => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
            if (gradientColors && gradientColors.length >= 2) {
                gradientColors.forEach((col, idx) => {
                    grad.addColorStop(idx / (gradientColors.length - 1), col);
                });
            } else {
                grad.addColorStop(0, '#18181b');
                grad.addColorStop(1, '#09090b');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1920);

            if (sticker) {
                ctx.font = '120px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(sticker, 540, 720);
            }

            if (text && text.trim()) {
                const fontSize = 64;
                ctx.font = `bold ${fontSize}px "Segoe UI", -apple-system, Roboto, sans-serif`;
                ctx.textAlign = 'center';

                const words = text.split(/\s+/);
                const lines = [];
                let currentLine = '';
                for (let n = 0; n < words.length; n++) {
                    const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > 860 && n > 0) {
                        lines.push(currentLine);
                        currentLine = words[n];
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) lines.push(currentLine);

                const lineHeight = 86;
                const startY = 960 - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, i) => {
                    const lineY = startY + i * lineHeight;
                    if (textBg) {
                        const lineWidth = ctx.measureText(line).width;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                        const padX = 32;
                        const padY = 16;
                        const x = 540 - lineWidth / 2 - padX;
                        const y = lineY - fontSize + 6;
                        const w = lineWidth + padX * 2;
                        const h = fontSize + padY;
                        const r = 24;
                        ctx.beginPath();
                        ctx.moveTo(x + r, y);
                        ctx.arcTo(x + w, y, x + w, y + h, r);
                        ctx.arcTo(x + w, y + h, x, y + h, r);
                        ctx.arcTo(x, y + h, x, y, r);
                        ctx.arcTo(x, y, x + w, y, r);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.fillStyle = textColor || '#ffffff';
                    ctx.fillText(line, 540, lineY);
                });
            }

            canvas.toBlob(blob => resolve(blob), 'image/png');
        } catch {
            resolve(null);
        }
    });
};

export default function HomePage({ posts, allUsers, friendUserIds, friends, onLike, onCommentSubmit, onPostCreated, onPostDeleted, onPostUpdated }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
    const mediaUrl = (url) => url?.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;

    const [suggestions, setSuggestions] = useState([]);
    const [sentSuggestionRequests, setSentSuggestionRequests] = useState(new Set());
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
    const [storyText, setStoryText] = useState('');
    const [storyTextColor, setStoryTextColor] = useState('#ffffff');
    const [storyTextBg, setStoryTextBg] = useState(true);
    const [storyBgIndex, setStoryBgIndex] = useState(0);
    const [activeStoryDrawer, setActiveStoryDrawer] = useState(null);
    const [isSubmittingStory, setIsSubmittingStory] = useState(false);
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
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
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
            if (typeof window !== 'undefined' && window.innerWidth > 768) {
                alert('Tính năng chia sẻ và đăng Story chỉ hỗ trợ trên thiết bị di động.');
                return;
            }
            const postToShare = e.detail;
            if (postToShare) {
                setSelectedStoryPost(postToShare);
                setIsCreateStoryOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('open-story-with-post', handleOpenStoryWithPost);
        return () => window.removeEventListener('open-story-with-post', handleOpenStoryWithPost);
    }, []);

    const handleOpenCreateStory = () => {
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
            alert('Tính năng đăng Story chỉ khả dụng trên thiết bị di động.');
            return;
        }
        setIsCreateStoryOpen(true);
    };

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

    useEffect(() => {
        if (!Array.isArray(allUsers) || allUsers.length === 0) return;
        const currentId = currentUser ? Number(currentUser.user_id || currentUser.id) : null;
        const friendSet = friendUserIds instanceof Set ? friendUserIds : new Set();
        const filtered = allUsers.filter(u => {
            if (!u || !u.user_id) return false;
            const uId = Number(u.user_id);
            if (currentId && uId === currentId) return false;
            if (friendSet.has(uId)) return false;
            return true;
        });
        setSuggestions(filtered);
    }, [allUsers, currentUser, friendUserIds]);

    const handleAddFriendSuggestion = async (targetUserId, e) => {
        if (e) e.stopPropagation();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const targetIdNum = Number(targetUserId);
        setSentSuggestionRequests(prev => new Set(prev).add(targetIdNum));
        try {
            const res = await safeFetch('/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, friend_id: targetUserId })
            });
            if (!res.ok) {
                setSentSuggestionRequests(prev => {
                    const next = new Set(prev);
                    next.delete(targetIdNum);
                    return next;
                });
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Không thể gửi lời mời kết bạn.');
            }
        } catch (err) {
            setSentSuggestionRequests(prev => {
                const next = new Set(prev);
                next.delete(targetIdNum);
                return next;
            });
            console.error('Lỗi gửi kết bạn:', err);
        }
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
        setStoryText('');
        setStoryTextColor('#ffffff');
        setStoryTextBg(true);
        setActiveStoryDrawer(null);
        setSelectedStoryPost(null);
    };

    const handleCreateStory = async (event) => {
        if (event) event.preventDefault();
        if (!currentUser) return;
        if (!storyFile && !selectedStoryPost && !storyText.trim() && !storySticker.trim()) {
            alert('Vui lòng thêm ảnh/video, văn bản hoặc biểu tượng để chia sẻ.');
            return;
        }

        setIsSubmittingStory(true);
        try {
            const formData = new FormData();
            formData.append('user_id', currentUser.user_id);

            let fileToUpload = storyFile;
            if (!fileToUpload && !selectedStoryPost) {
                const blob = await generateStoryCanvasBlob(
                    storyText,
                    storyTextColor,
                    storyTextBg,
                    STORY_GRADIENTS[storyBgIndex].colors,
                    storySticker
                );
                if (blob) {
                    fileToUpload = new File([blob], 'story.png', { type: 'image/png' });
                }
            }

            if (fileToUpload) formData.append('storyMedia', fileToUpload);
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

            const stickerPayload = {
                sticker: storySticker || '',
                text: storyText || '',
                textColor: storyTextColor,
                textBg: storyTextBg,
                gradientIndex: storyBgIndex
            };
            formData.append('sticker', JSON.stringify(stickerPayload));

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
        } finally {
            setIsSubmittingStory(false);
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

        setSentSuggestionRequests(prev => new Set(prev).add(targetId));

        try {
            const res = await safeFetch('/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: myId, addressee_id: targetId })
            });
            if (!res.ok) {
                setSentSuggestionRequests(prev => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                });
                const data = await res.json().catch(() => ({}));
                alert(data.message || "Lỗi máy chủ khi gửi kết bạn.");
            }
        } catch (err) {
            setSentSuggestionRequests(prev => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
            console.error("Lỗi khi gửi kết bạn:", err);
            alert("Không thể kết nối đến máy chủ.");
        }
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
                            {/* Nút đăng story của người dùng (chỉ hiển thị trên mobile) */}
                            {currentUser && (
                                <div
                                    className="story-card-item story-create-item"
                                    onClick={handleOpenCreateStory}
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
                            )}

                            {/* MODAL TẠO STORY KIỂU INSTAGRAM CHUYÊN NGHIỆP */}
                            {isCreateStoryOpen && currentUser && (
                                <div className="ig-story-backdrop" onClick={handleCloseStoryModal}>
                                    <div className="ig-story-frame" onClick={e => e.stopPropagation()}>
                                        {/* Top Toolbar */}
                                        <div className="ig-story-topbar">
                                            <button
                                                type="button"
                                                className="ig-story-icon-btn"
                                                onClick={handleCloseStoryModal}
                                                title="Đóng"
                                                aria-label="Đóng Story"
                                            >
                                                <X size={22} />
                                            </button>

                                            <div className="ig-story-tool-group">
                                                {/* Text Tool Aa */}
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${activeStoryDrawer === 'text' || storyText ? 'active' : ''}`}
                                                    onClick={() => setActiveStoryDrawer(activeStoryDrawer === 'text' ? null : 'text')}
                                                    title="Thêm văn bản"
                                                >
                                                    <span className="ig-story-tool-aa">Aa</span>
                                                </button>

                                                {/* Sticker Tool */}
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${activeStoryDrawer === 'sticker' || storySticker ? 'active' : ''}`}
                                                    onClick={() => setActiveStoryDrawer(activeStoryDrawer === 'sticker' ? null : 'sticker')}
                                                    title="Nhãn dán"
                                                >
                                                    <Smile size={20} />
                                                </button>

                                                {/* Music Tool */}
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${activeStoryDrawer === 'music' || selectedSpotifyTrack || storyMusic ? 'active' : ''}`}
                                                    onClick={() => setActiveStoryDrawer(activeStoryDrawer === 'music' ? null : 'music')}
                                                    title="Thêm nhạc nền"
                                                >
                                                    <Music2 size={20} />
                                                </button>

                                                {/* Palette / Gradient Tool */}
                                                {!storyFile && (
                                                    <button
                                                        type="button"
                                                        className="ig-story-tool-btn"
                                                        onClick={() => setStoryBgIndex(prev => (prev + 1) % STORY_GRADIENTS.length)}
                                                        title="Đổi màu nền"
                                                    >
                                                        <Palette size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Story Live Canvas (9:16 Aspect Ratio) */}
                                        <div
                                            className="ig-story-canvas"
                                            style={{
                                                background: storyFile ? '#000000' : STORY_GRADIENTS[storyBgIndex].value
                                            }}
                                        >
                                            {/* Media File (Photo/Video) Preview */}
                                            {storyFile && (
                                                <div className="ig-story-media-layer">
                                                    {storyFile.type.startsWith('video/') ? (
                                                        <video src={URL.createObjectURL(storyFile)} controls autoPlay loop />
                                                    ) : (
                                                        <img src={URL.createObjectURL(storyFile)} alt="Story Media" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="ig-story-remove-media-pill"
                                                        onClick={() => setStoryFile(null)}
                                                        title="Xóa tệp ảnh/video"
                                                    >
                                                        <Trash2 size={13} /> Xóa tệp
                                                    </button>
                                                </div>
                                            )}

                                            {/* Shared Post Card (from Feed) */}
                                            {selectedStoryPost && (
                                                <div className="ig-story-shared-card">
                                                    <div className="ig-story-shared-header">
                                                        <Avatar user={{ username: selectedStoryPost.author, profile_photo_url: selectedStoryPost.authorAvatar }} size={26} />
                                                        <span className="ig-story-shared-author">@{selectedStoryPost.author}</span>
                                                        <button
                                                            type="button"
                                                            className="ig-story-shared-close"
                                                            onClick={() => setSelectedStoryPost(null)}
                                                            title="Bỏ bài viết đã chọn"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    {selectedStoryPost.imageUrl && (
                                                        <div className="ig-story-shared-thumb">
                                                            <img src={mediaUrl(selectedStoryPost.imageUrl)} alt="" />
                                                        </div>
                                                    )}
                                                    {selectedStoryPost.content && (
                                                        <p className="ig-story-shared-caption">{selectedStoryPost.content}</p>
                                                    )}
                                                    <span className="ig-story-shared-badge">Xem bài viết</span>
                                                </div>
                                            )}

                                            {/* Floating Sticker */}
                                            {storySticker && (
                                                <div className="ig-story-sticker-layer">
                                                    <span className="ig-story-sticker-display">{storySticker}</span>
                                                    <button
                                                        type="button"
                                                        className="ig-story-sticker-remove"
                                                        onClick={() => setStorySticker('')}
                                                        title="Xóa nhãn dán"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Floating Music Badge */}
                                            {(selectedSpotifyTrack || storyMusic) && (
                                                <div className="ig-story-music-badge">
                                                    <Music2 size={14} className="ig-story-music-icon" />
                                                    <div className="ig-story-music-meta">
                                                        <strong>{selectedSpotifyTrack ? selectedSpotifyTrack.name : storyMusic.name}</strong>
                                                        {selectedSpotifyTrack && <small>{selectedSpotifyTrack.artists}</small>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="ig-story-music-remove"
                                                        onClick={() => {
                                                            if (previewAudio) previewAudio.pause();
                                                            setSelectedSpotifyTrack(null);
                                                            setStoryMusic(null);
                                                            setPlayingTrackId(null);
                                                        }}
                                                        title="Xóa bài hát"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Live Text Overlay & Input */}
                                            <div className="ig-story-text-layer">
                                                <textarea
                                                    value={storyText}
                                                    onChange={e => setStoryText(e.target.value)}
                                                    placeholder="Chạm để nhập văn bản..."
                                                    className={`ig-story-textarea ${storyTextBg ? 'has-bg' : ''}`}
                                                    style={{ color: storyTextColor }}
                                                    rows={Math.max(1, (storyText.match(/\n/g) || []).length + 1)}
                                                />
                                            </div>

                                            {/* Prompt to pick image if canvas is empty and no text */}
                                            {!storyFile && !selectedStoryPost && !storyText && (
                                                <label className="ig-story-upload-center">
                                                    <ImageIcon size={34} />
                                                    <span>Chọn ảnh hoặc video</span>
                                                    <small>Hoặc gõ chữ trực tiếp lên màn hình</small>
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        hidden
                                                        onChange={e => setStoryFile(e.target.files?.[0] || null)}
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* Drawer 1: Text Options (Color Palette + Badge Toggle) */}
                                        {activeStoryDrawer === 'text' && (
                                            <div className="ig-story-drawer">
                                                <div className="ig-story-drawer-header">
                                                    <span>Định dạng chữ</span>
                                                    <button
                                                        type="button"
                                                        className={`ig-story-text-bg-toggle ${storyTextBg ? 'active' : ''}`}
                                                        onClick={() => setStoryTextBg(!storyTextBg)}
                                                    >
                                                        Nền chữ: {storyTextBg ? 'Bật' : 'Tắt'}
                                                    </button>
                                                </div>
                                                <div className="ig-story-color-palette">
                                                    {['#ffffff', '#000000', '#facc15', '#f43f5e', '#22c55e', '#06b6d4', '#a855f7', '#fb923c'].map(col => (
                                                        <button
                                                            type="button"
                                                            key={col}
                                                            className={`ig-story-color-dot ${storyTextColor === col ? 'active' : ''}`}
                                                            style={{ background: col }}
                                                            onClick={() => setStoryTextColor(col)}
                                                            title={col}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Drawer 2: Stickers / Emojis */}
                                        {activeStoryDrawer === 'sticker' && (
                                            <div className="ig-story-drawer">
                                                <div className="ig-story-drawer-header">
                                                    <span>Biểu tượng & Sticker</span>
                                                    <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                        Xong
                                                    </button>
                                                </div>
                                                <div className="ig-story-emoji-grid">
                                                    {['🔥', '❤️', '✨', '🎉', '😂', '😍', '👏', '💯', '⚡', '☕', '🥳', '🍕', '🎶', '🌈', '🚀', '💫'].map(em => (
                                                        <button
                                                            type="button"
                                                            key={em}
                                                            className="ig-story-emoji-btn"
                                                            onClick={() => {
                                                                setStorySticker(em);
                                                                setActiveStoryDrawer(null);
                                                            }}
                                                        >
                                                            {em}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="ig-story-custom-sticker-row">
                                                    <input
                                                        value={storySticker}
                                                        onChange={e => setStorySticker(e.target.value)}
                                                        placeholder="Hoặc nhập sticker / emoji khác..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Drawer 3: Music Search & MP3 */}
                                        {activeStoryDrawer === 'music' && (
                                            <div className="ig-story-drawer ig-story-music-drawer">
                                                <div className="ig-story-drawer-header">
                                                    <span>Chọn nhạc nền</span>
                                                    <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                        Xong
                                                    </button>
                                                </div>

                                                <div className="spotify-search-row">
                                                    <input
                                                        value={spotifyQuery}
                                                        onChange={e => setSpotifyQuery(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchSpotify())}
                                                        placeholder="Tìm bài hát, ca sĩ..."
                                                    />
                                                    <button type="button" onClick={searchSpotify} disabled={isSpotifySearching}>
                                                        <Search size={16} />
                                                    </button>
                                                </div>

                                                {isSpotifySearching && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>Đang tìm kiếm bài hát...</p>
                                                )}
                                                {musicSearchError && (
                                                    <p style={{ color: '#fca5a5', fontSize: '12.5px', marginTop: '6px' }}>{musicSearchError}</p>
                                                )}

                                                {spotifyResults.length > 0 && (
                                                    <div className="spotify-results no-scrollbar" style={{ maxHeight: '160px', marginTop: '8px' }}>
                                                        {spotifyResults.map(track => {
                                                            const isPlaying = playingTrackId === track.id;
                                                            return (
                                                                <div
                                                                    key={track.id}
                                                                    className="story-track-item"
                                                                    onClick={() => {
                                                                        setSelectedSpotifyTrack(track);
                                                                        setStoryMusic(null);
                                                                        setActiveStoryDrawer(null);
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
                                                                            title={isPlaying ? 'Dừng' : 'Nghe thử 30s'}
                                                                        >
                                                                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <label className="story-music-picker" style={{ marginTop: '8px' }}>
                                                    <Music2 size={16} />
                                                    {storyMusic ? storyMusic.name : 'Hoặc tải tệp MP3 từ máy'}
                                                    <input
                                                        type="file"
                                                        accept="audio/mpeg,.mp3"
                                                        onChange={e => {
                                                            setStoryMusic(e.target.files?.[0] || null);
                                                            setSelectedSpotifyTrack(null);
                                                            setActiveStoryDrawer(null);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        {/* Bottom Bar: Media Picker & Share Pill */}
                                        <div className="ig-story-bottombar">
                                            <label className="ig-story-media-btn" title="Chọn ảnh hoặc video từ máy">
                                                <ImageIcon size={22} />
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    hidden
                                                    onChange={e => setStoryFile(e.target.files?.[0] || null)}
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                className="ig-story-share-pill"
                                                onClick={handleCreateStory}
                                                disabled={isSubmittingStory || (!storyFile && !selectedStoryPost && !storyText.trim() && !storySticker.trim())}
                                            >
                                                <div className="ig-story-share-avatar">
                                                    <Avatar user={currentUser} size={28} />
                                                </div>
                                                <span>{isSubmittingStory ? 'Đang chia sẻ...' : 'Tin của bạn'}</span>
                                                <Send size={15} style={{ marginLeft: '4px' }} />
                                            </button>
                                        </div>
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
                                {activeStory.sticker && (() => {
                                    try {
                                        const parsed = JSON.parse(activeStory.sticker);
                                        return (
                                            <>
                                                {parsed.sticker && <div className="story-sticker">{parsed.sticker}</div>}
                                                {parsed.text && (
                                                    <div
                                                        className={`story-text-overlay ${parsed.textBg ? 'has-bg' : ''}`}
                                                        style={{
                                                            color: parsed.textColor || '#ffffff',
                                                            background: parsed.textBg ? 'rgba(0, 0, 0, 0.65)' : 'transparent'
                                                        }}
                                                    >
                                                        {parsed.text}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    } catch {
                                        return <div className="story-sticker">{activeStory.sticker}</div>;
                                    }
                                })()}
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

                    {/* GỢI Ý TÀI KHOẢN DÀNH CHO MOBILE (CHUẨN INSTAGRAM) */}
                    {suggestions && suggestions.length > 0 && (
                        <section className="ig-mobile-suggestions-section">
                            <div className="ig-suggestions-header">
                                <span className="ig-suggestions-title">Gợi ý cho bạn</span>
                                <button
                                    type="button"
                                    className="ig-suggestions-see-all"
                                    onClick={() => navigate('/explore')}
                                >
                                    Xem tất cả
                                </button>
                            </div>
                            <div className="ig-suggestions-scroll-track no-scrollbar">
                                {suggestions.map(user => {
                                    const isSent = sentSuggestionRequests.has(Number(user.user_id));
                                    return (
                                        <div key={user.user_id} className="ig-suggested-card">
                                            <div
                                                className="ig-suggested-card-inner"
                                                onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <Avatar user={user} size={54} />
                                                <div className="ig-suggested-username-row">
                                                    <span className="ig-suggested-username">{user.username}</span>
                                                    {user.is_verified && (
                                                        <svg className="verified-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="#0095f6">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="ig-suggested-reason">Gợi ý cho bạn</span>
                                            </div>
                                            <button
                                                type="button"
                                                className={`ig-suggested-action-btn ${isSent ? 'sent' : ''}`}
                                                onClick={(e) => handleAddFriendSuggestion(user.user_id, e)}
                                                disabled={isSent}
                                            >
                                                <UserPlus size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                                {isSent ? 'Đã gửi' : 'Theo dõi'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* DANH SÁCH BÀI VIẾT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {posts && posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard
                                    key={post.post_id || post.id}
                                    post={post}
                                    friendUserIds={friendUserIds}
                                    onLike={onLike}
                                    onCommentSubmit={onCommentSubmit}
                                    onPostDeleted={onPostDeleted}
                                    onPostUpdated={onPostUpdated}
                                />
                            ))
                        ) : (
                            <div className="empty-feed-card">
                                <div className="empty-feed-icon-wrap">
                                    <Users size={32} color="#0095f6" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Chào mừng bạn đến với SocialHub
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                                    Hãy theo dõi hoặc kết bạn với các tài khoản dưới đây để khám phá bài viết thú vị trên bảng tin của bạn:
                                </p>
                                {suggestions && suggestions.length > 0 && (
                                    <div className="empty-feed-suggestions-grid">
                                        {suggestions.slice(0, 6).map(user => {
                                            const isSent = sentSuggestionRequests.has(Number(user.user_id));
                                            return (
                                                <div key={user.user_id} className="empty-feed-user-chip">
                                                    <div
                                                        className="empty-feed-user-meta"
                                                        onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <Avatar user={user} size={42} />
                                                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {user.username}
                                                                {user.is_verified && (
                                                                    <svg className="verified-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="#0095f6">
                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gợi ý cho bạn</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={`empty-feed-connect-btn ${isSent ? 'sent' : ''}`}
                                                        onClick={(e) => handleAddFriendSuggestion(user.user_id, e)}
                                                        disabled={isSent}
                                                    >
                                                        {isSent ? 'Đã gửi' : 'Theo dõi'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                suggestions.map(user => {
                                    const isSent = sentSuggestionRequests.has(Number(user.user_id));
                                    return (
                                        <div key={user.user_id} className="suggestion-user-row">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                                className="suggestion-user-meta"
                                                title={`Xem trang của ${user.username}`}
                                            >
                                                <Avatar user={user} size={36} />
                                                <div>
                                                    <div className="suggestion-username" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {user.username}
                                                        {user.is_verified && (
                                                            <svg className="verified-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="#0095f6">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="suggestion-subtitle">Gợi ý cho bạn</div>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleAddFriendSuggestion(user.user_id, e)}
                                                className={`btn-connect-user ${isSent ? 'sent' : ''}`}
                                                disabled={isSent}
                                                title={isSent ? 'Đã gửi lời mời' : 'Thêm bạn bè'}
                                            >
                                                <UserPlus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                {isSent ? 'Đã gửi' : 'Kết bạn'}
                                            </button>
                                        </div>
                                    );
                                })
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