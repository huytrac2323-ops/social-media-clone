import { useState, useEffect, useRef, useMemo } from 'react';
import CreatePost from '../modals/CreatePost.jsx';
import PostCard from '../components/PostCard.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectDetailModal from '../modals/ProjectDetailModal.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';
import { safeFetch, getApiBaseUrl } from '../utils/api';
import {
    Plus,
    X,
    Users,
    UserPlus,
    UserCheck,
    Image as ImageIcon,
    Eye,
    MoreVertical,
    Pencil,
    Trash2,
    Music2,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    FileText,
    Smile,
    Palette,
    Send,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Clock,
    MapPin,
    Sparkles,
    Scissors,
    Volume2,
    VolumeX,
    ZoomIn,
    ZoomOut,
    Crop,
    Maximize2,
    Minimize2,
    RotateCcw,
    LayoutGrid,
    List,
    Briefcase,
    Layers
} from 'lucide-react';

const STORY_GRADIENTS = [
    { name: 'Sunset', value: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', colors: ['#f09433', '#dc2743', '#bc1888'] },
    { name: 'Ocean', value: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)', colors: ['#0284c7', '#2563eb', '#4f46e5'] },
    { name: 'Purple', value: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%)', colors: ['#1e1b4b', '#4338ca', '#7c3aed'] },
    { name: 'Cyber', value: 'linear-gradient(135deg, #091e3a 0%, #2563eb 60%, #38bdf8 100%)', colors: ['#091e3a', '#2563eb', '#38bdf8'] },
    { name: 'Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)', colors: ['#064e3b', '#059669', '#34d399'] },
    { name: 'Berry', value: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)', colors: ['#831843', '#db2777', '#f472b6'] },
    { name: 'Noir', value: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)', colors: ['#18181b', '#09090b'] }
];

const formatSeconds = (sec) => {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const generateStoryCanvasBlob = async (
    text,
    textColor,
    textBgMode = 'semi',
    gradientColors,
    sticker,
    textPos = { x: 50, y: 55 },
    stickerPos = { x: 50, y: 35 },
    textFont = 'modern',
    textAlign = 'center'
) => {
    return new Promise(resolve => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            // Nền Gradient
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

            // Vẽ Sticker / Icon Instagram
            if (sticker) {
                const stX = 1080 * ((stickerPos?.x ?? 50) / 100);
                const stY = 1920 * ((stickerPos?.y ?? 35) / 100);

                if (sticker.startsWith('⏰')) {
                    const timeText = sticker.replace(/^⏰\s*/, '');
                    ctx.save();
                    ctx.font = '900 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'center';
                    const textMetrics = ctx.measureText(timeText);
                    const padX = 48;
                    const boxW = textMetrics.width + padX * 2;
                    const boxH = 114;
                    const bX = stX - boxW / 2;
                    const bY = stY - boxH / 2;

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    const r = 28;
                    ctx.moveTo(bX + r, bY);
                    ctx.arcTo(bX + boxW, bY, bX + boxW, bY + boxH, r);
                    ctx.arcTo(bX + boxW, bY + boxH, bX, bY + boxH, r);
                    ctx.arcTo(bX, bY + boxH, bX, bY, r);
                    ctx.arcTo(bX, bY, bX + boxW, bY, r);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#000000';
                    ctx.fillText(timeText, stX, stY + 28);
                    ctx.restore();
                } else if (sticker.startsWith('📍')) {
                    const locText = sticker;
                    ctx.save();
                    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'center';
                    const textMetrics = ctx.measureText(locText);
                    const padX = 42;
                    const boxW = textMetrics.width + padX * 2;
                    const boxH = 96;
                    const bX = stX - boxW / 2;
                    const bY = stY - boxH / 2;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                    ctx.beginPath();
                    const r = 48;
                    ctx.moveTo(bX + r, bY);
                    ctx.arcTo(bX + boxW, bY, bX + boxW, bY + boxH, r);
                    ctx.arcTo(bX + boxW, bY + boxH, bX, bY + boxH, r);
                    ctx.arcTo(bX, bY + boxH, bX, bY, r);
                    ctx.arcTo(bX, bY, bX + boxW, bY, r);
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(locText, stX, stY + 18);
                    ctx.restore();
                } else {
                    ctx.font = '130px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(sticker, stX, stY);
                }
            }

            // Vẽ Văn bản đa phong cách chuẩn Instagram
            if (text && text.trim()) {
                let fontSpec = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                let fontSize = 64;
                let lineHeight = 86;

                if (textFont === 'classic') {
                    fontSpec = 'italic bold 64px Georgia, "Times New Roman", serif';
                } else if (textFont === 'neon') {
                    fontSpec = 'bold 68px "Brush Script MT", "Dancing Script", cursive, sans-serif';
                    fontSize = 68;
                    lineHeight = 90;
                } else if (textFont === 'typewriter') {
                    fontSpec = 'bold 60px "Courier New", Courier, monospace';
                    fontSize = 60;
                    lineHeight = 82;
                } else if (textFont === 'strong') {
                    fontSpec = '900 68px "Arial Black", Impact, sans-serif';
                    fontSize = 68;
                    lineHeight = 92;
                }

                ctx.font = fontSpec;
                ctx.textAlign = textAlign || 'center';

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

                const targetX = 1080 * ((textPos?.x ?? 50) / 100);
                const targetY = 1920 * ((textPos?.y ?? 55) / 100);
                const startY = targetY - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, i) => {
                    const lineY = startY + i * lineHeight;
                    const lineWidth = ctx.measureText(line).width;

                    let bgX = targetX - lineWidth / 2;
                    if (textAlign === 'left') bgX = targetX;
                    else if (textAlign === 'right') bgX = targetX - lineWidth;

                    if (textBgMode === 'semi' || textBgMode === true) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                        const padX = 32;
                        const padY = 16;
                        const x = bgX - padX;
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
                    } else if (textBgMode === 'solid') {
                        ctx.fillStyle = (textColor === '#000000' || textColor === '#09090b') ? '#ffffff' : '#000000';
                        const padX = 32;
                        const padY = 16;
                        const x = bgX - padX;
                        const y = lineY - fontSize + 6;
                        const w = lineWidth + padX * 2;
                        const h = fontSize + padY;
                        const r = 20;
                        ctx.beginPath();
                        ctx.moveTo(x + r, y);
                        ctx.arcTo(x + w, y, x + w, y + h, r);
                        ctx.arcTo(x + w, y + h, x, y + h, r);
                        ctx.arcTo(x, y + h, x, y, r);
                        ctx.arcTo(x, y, x + w, y, r);
                        ctx.closePath();
                        ctx.fill();
                    }

                    if (textFont === 'neon') {
                        ctx.shadowColor = textColor || '#ffffff';
                        ctx.shadowBlur = 18;
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillStyle = textBgMode === 'solid'
                        ? ((textColor === '#000000' || textColor === '#09090b') ? '#000000' : '#ffffff')
                        : (textColor || '#ffffff');
                    ctx.fillText(line, targetX, lineY);
                    ctx.shadowBlur = 0;
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
    const API_URL = getApiBaseUrl();
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
    const [storyTextFont, setStoryTextFont] = useState('modern');
    const [storyTextAlign, setStoryTextAlign] = useState('center');
    const [storyTextBgMode, setStoryTextBgMode] = useState('semi');
    const [storyBgIndex, setStoryBgIndex] = useState(0);
    const [stickerPos, setStickerPos] = useState({ x: 50, y: 35 });
    const [textPos, setTextPos] = useState({ x: 50, y: 55 });
    const [draggingItem, setDraggingItem] = useState(null);
    const canvasRef = useRef(null);
    const [floatingStoryReactions, setFloatingStoryReactions] = useState([]);
    const reactionDebounceTimer = useRef(null);
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
    const [storyEditText, setStoryEditText] = useState('');
    const [storyEditEmoji, setStoryEditEmoji] = useState('');
    const [storyEditTextColor, setStoryEditTextColor] = useState('#ffffff');
    const [storyEditTextBgMode, setStoryEditTextBgMode] = useState('semi');
    const [isUpdatingStory, setIsUpdatingStory] = useState(false);

    // States và Refs cho Story Viewer: Scrubber tua video & Nhấn giữ tạm dừng & Chuyển Story Trái / Phải
    const viewerVideoRef = useRef(null);
    const viewerAudioRef = useRef(null);
    const [viewerCurrentTime, setViewerCurrentTime] = useState(0);
    const [viewerDuration, setViewerDuration] = useState(15);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [isHoldingPause, setIsHoldingPause] = useState(false);
    const [activeStoryList, setActiveStoryList] = useState([]);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);
    const holdStartTimeRef = useRef(0);
    const isHoldingRef = useRef(false);
    const holdTimerRef = useRef(null);

    const currentUserId = currentUser?.user_id || currentUser?.id;
    const myStories = useMemo(() => {
        if (!currentUserId && !currentUser?.username) return [];
        return stories.filter(s =>
            (currentUserId && Number(s.user_id) === Number(currentUserId)) ||
            (currentUser?.username && s.username === currentUser?.username)
        );
    }, [stories, currentUserId, currentUser?.username]);

    const friendStories = useMemo(() => {
        if (!currentUserId && !currentUser?.username) return stories;
        return stories.filter(s =>
            (!currentUserId || Number(s.user_id) !== Number(currentUserId)) &&
            (!currentUser?.username || s.username !== currentUser?.username)
        );
    }, [stories, currentUserId, currentUser?.username]);

    const [selectedStoryPost, setSelectedStoryPost] = useState(null);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);

    // States cho Behance Grid Feed & Bố cục linh hoạt
    const [selectedProject, setSelectedProject] = useState(null);
    const [feedFilterCategory, setFeedFilterCategory] = useState('all');
    const [feedDisplayMode, setFeedDisplayMode] = useState('grid'); // 'grid' (mặc định Lưới Behance) | 'timeline' (Dòng thời gian)
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

    const filteredPosts = useMemo(() => {
        if (!posts || posts.length === 0) return [];
        if (feedFilterCategory === 'all') return posts;
        return posts.filter(p => {
            const matchCategory = p.category === feedFilterCategory;
            const matchTool = p.toolsUsed && p.toolsUsed.some(t => t.toLowerCase().includes(feedFilterCategory.toLowerCase()));
            const matchText = p.title && p.title.toLowerCase().includes(feedFilterCategory.toLowerCase());
            return matchCategory || matchTool || matchText;
        });
    }, [posts, feedFilterCategory]);

    // Memoize preview URLs để KHÔNG tạo lại Blob URL mỗi khi re-render (ngăn chặn reset video khi gõ chữ, chọn icon, nhạc)
    const storyMediaPreviewUrl = useMemo(() => {
        if (!storyFile) return null;
        return URL.createObjectURL(storyFile);
    }, [storyFile]);

    useEffect(() => {
        return () => {
            if (storyMediaPreviewUrl) URL.revokeObjectURL(storyMediaPreviewUrl);
        };
    }, [storyMediaPreviewUrl]);

    const storyEditMediaPreviewUrl = useMemo(() => {
        if (!storyEditFile) return null;
        return URL.createObjectURL(storyEditFile);
    }, [storyEditFile]);

    useEffect(() => {
        return () => {
            if (storyEditMediaPreviewUrl) URL.revokeObjectURL(storyEditMediaPreviewUrl);
        };
    }, [storyEditMediaPreviewUrl]);

    // Các state điều chỉnh video (Trimmer & Mute)
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoStartTime, setVideoStartTime] = useState(0);
    const [videoEndTime, setVideoEndTime] = useState(0);
    const [videoIsMuted, setVideoIsMuted] = useState(false);
    const videoPreviewRef = useRef(null);

    // Các state điều chỉnh Zoom, Crop, Pan cho ảnh/video
    const [mediaScale, setMediaScale] = useState(1);
    const [mediaOffset, setMediaOffset] = useState({ x: 0, y: 0 });
    const [mediaFit, setMediaFit] = useState('cover'); // 'cover' (tràn khung) | 'contain' (vừa khung)
    const [isPanningMedia, setIsPanningMedia] = useState(false);
    const panStartPos = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });
    const pinchStartDist = useRef(0);
    const pinchStartScale = useRef(1);

    // Tự động đặt lại các thông số video & zoom khi đổi tệp story
    useEffect(() => {
        setMediaScale(1);
        setMediaOffset({ x: 0, y: 0 });
        setMediaFit('cover');
        setVideoDuration(0);
        setVideoStartTime(0);
        setVideoEndTime(0);
        setVideoIsMuted(false);
    }, [storyFile]);

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
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('open-story-with-post', handleOpenStoryWithPost);
        return () => window.removeEventListener('open-story-with-post', handleOpenStoryWithPost);
    }, []);

    const handleOpenCreateStory = () => {
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
        const normalizeStr = (s) => (s ? String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '');
        const currAddress = normalizeStr(currentUser?.address);
        const currHometown = normalizeStr(currentUser?.hometown);
        const currAge = currentUser?.age ? Number(currentUser.age) : null;
        const currInterests = normalizeStr(currentUser?.interests)
            .split(/[,\s;]+/)
            .map(t => t.trim())
            .filter(t => t.length >= 2);

        const filtered = allUsers
            .filter(u => {
                if (!u || !u.user_id) return false;
                const uId = Number(u.user_id);
                if (currentId && uId === currentId) return false;
                if (friendSet.has(uId)) return false;
                return true;
            })
            .map(u => {
                let score = 0;
                let reason = '';

                const uAddress = normalizeStr(userAddress(u));
                const uHometown = normalizeStr(u.hometown);
                const uAge = u.age ? Number(u.age) : null;
                const uInterests = normalizeStr(u.interests)
                    .split(/[,\s;]+/)
                    .map(t => t.trim())
                    .filter(t => t.length >= 2);

                function userAddress(user) {
                    return user.address || '';
                }

                // Tìm sở thích chung
                let common = [];
                if (currInterests.length > 0 && uInterests.length > 0) {
                    common = currInterests.filter(ci => uInterests.some(ui => ui.includes(ci) || ci.includes(ui)));
                }

                // 1. Ưu tiên hàng đầu: Tài khoản tích xanh có sở thích liên quan (+150 điểm)
                if (u.is_verified && common.length > 0) {
                    score += 150 + common.length * 30;
                    const originalTags = (u.interests || '').split(',').map(s => s.trim()).filter(Boolean);
                    const matchedTags = originalTags.filter(ot => common.some(ci => normalizeStr(ot).includes(ci)));
                    const displayCommon = matchedTags.length > 0 ? matchedTags.slice(0, 2).join(', ') : common.slice(0, 2).join(', ');
                    reason = `✨ Cùng sở thích: ${displayCommon}`;
                } else if (common.length > 0) {
                    score += common.length * 35;
                    const originalTags = (u.interests || '').split(',').map(s => s.trim()).filter(Boolean);
                    const matchedTags = originalTags.filter(ot => common.some(ci => normalizeStr(ot).includes(ci)));
                    const displayCommon = matchedTags.length > 0 ? matchedTags.slice(0, 2).join(', ') : common.slice(0, 2).join(', ');
                    reason = `✨ Cùng sở thích: ${displayCommon}`;
                } else if (u.is_verified) {
                    // Tự động đề xuất người dùng nổi bật (+50 điểm)
                    score += 50;
                    reason = 'Gợi ý cho bạn';
                }

                // 2. So khớp địa chỉ / nơi ở (+40 điểm)
                if (currAddress && uAddress) {
                    if (currAddress === uAddress || currAddress.includes(uAddress) || uAddress.includes(currAddress)) {
                        score += 40;
                        if (!reason) {
                            reason = `📍 Cùng ở ${u.address}`;
                        }
                    }
                }

                // 3. So khớp quê quán (+35 điểm)
                if (currHometown && uHometown) {
                    if (currHometown === uHometown || currHometown.includes(uHometown) || uHometown.includes(currHometown)) {
                        score += 35;
                        if (!reason) {
                            reason = `🏡 Cùng quê ${u.hometown}`;
                        }
                    }
                }

                // 4. So khớp độ tuổi (~ 3 tuổi) (+20 điểm)
                if (currAge && uAge) {
                    const diff = Math.abs(currAge - uAge);
                    if (diff <= 3) {
                        score += Math.max(10, 25 - diff * 5);
                        if (!reason) {
                            reason = `🎂 Cùng độ tuổi (~${uAge})`;
                        }
                    }
                }

                if (!reason) {
                    reason = 'Gợi ý cho bạn';
                }

                return {
                    ...u,
                    score,
                    suggestion_reason: reason
                };
            });

        filtered.sort((a, b) => b.score - a.score);
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

    const [followedSuggestionIds, setFollowedSuggestionIds] = useState(new Set());

    const handleFollowSuggestion = async (targetUserId, e) => {
        if (e) e.stopPropagation();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const targetIdNum = Number(targetUserId);
        const isCurrentlyFollowing = followedSuggestionIds.has(targetIdNum);

        // Cập nhật giao diện tức thì (Optimistic UI - theo dõi trực tiếp)
        setFollowedSuggestionIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyFollowing) next.delete(targetIdNum);
            else next.add(targetIdNum);
            return next;
        });

        try {
            const endpoint = isCurrentlyFollowing
                ? `/friends/follow/${currentUser.user_id}/${targetUserId}`
                : `/friends/follow`;
            const res = await safeFetch(endpoint, {
                method: isCurrentlyFollowing ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: isCurrentlyFollowing
                    ? undefined
                    : JSON.stringify({ follower_id: currentUser.user_id, followee_id: targetUserId })
            });
            if (!res.ok) {
                // Hoàn tác nếu lỗi
                setFollowedSuggestionIds(prev => {
                    const next = new Set(prev);
                    if (isCurrentlyFollowing) next.add(targetIdNum);
                    else next.delete(targetIdNum);
                    return next;
                });
            }
        } catch (err) {
            setFollowedSuggestionIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyFollowing) next.add(targetIdNum);
                else next.delete(targetIdNum);
                return next;
            });
            console.error('Lỗi theo dõi gợi ý:', err);
        }
    };

    const fetchStories = async () => {
        try {
            const viewerId = currentUser?.user_id || currentUser?.id || '';
            const res = await safeFetch(`/stories?userId=${viewerId}`);
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
        const handleFocus = () => fetchStories();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentUser?.user_id, currentUser?.id, currentUser?.username]);

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
        setStoryTextFont('modern');
        setStoryTextAlign('center');
        setStoryTextBgMode('semi');
        setStickerPos({ x: 50, y: 35 });
        setTextPos({ x: 50, y: 55 });
        setDraggingItem(null);
        setActiveStoryDrawer(null);
        setSelectedStoryPost(null);
        setMediaScale(1);
        setMediaOffset({ x: 0, y: 0 });
        setMediaFit('cover');
        setVideoDuration(0);
        setVideoStartTime(0);
        setVideoEndTime(0);
        setVideoIsMuted(false);
    };

    const handleDragStart = (item, e) => {
        e.stopPropagation();
        setDraggingItem(item);
    };

    const handleCanvasMove = (e) => {
        if (!draggingItem || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const xPercent = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
        const yPercent = Math.max(10, Math.min(90, ((clientY - rect.top) / rect.height) * 100));

        if (draggingItem === 'sticker') {
            setStickerPos({ x: Math.round(xPercent), y: Math.round(yPercent) });
        } else if (draggingItem === 'text') {
            setTextPos({ x: Math.round(xPercent), y: Math.round(yPercent) });
        }
    };

    const handleDragEnd = () => {
        setDraggingItem(null);
    };

    // Xử lý nạp metadata video: đọc thời lượng và thiết lập điểm kết thúc mặc định (tối đa 30s)
    const handleVideoLoadedMetadata = (e) => {
        const video = e.target;
        const dur = Math.round(video.duration || 0);
        setVideoDuration(dur);
        setVideoStartTime(0);
        setVideoEndTime(dur > 0 ? Math.min(dur, 30) : 15);
    };

    // Vòng lặp phát video trong khoảng thời lượng đã cắt [videoStartTime -> videoEndTime]
    const handleVideoTimeUpdate = (e) => {
        const video = e.target;
        if (videoEndTime > 0 && video.currentTime >= videoEndTime) {
            video.currentTime = videoStartTime;
            video.play().catch(() => {});
        }
        if (video.currentTime < videoStartTime) {
            video.currentTime = videoStartTime;
        }
    };

    const handleStartTimeChange = (val) => {
        const newStart = Math.max(0, Math.min(Number(val), (videoEndTime || videoDuration) - 1));
        setVideoStartTime(newStart);
        if (videoPreviewRef.current) {
            videoPreviewRef.current.currentTime = newStart;
        }
    };

    const handleEndTimeChange = (val) => {
        const newEnd = Math.max(videoStartTime + 1, Math.min(Number(val), videoDuration || 60));
        setVideoEndTime(newEnd);
        if (videoPreviewRef.current) {
            videoPreviewRef.current.currentTime = videoStartTime;
        }
    };

    // Xử lý cử chỉ chạm cảm ứng trên ảnh/video: 2 ngón để Pinch Zoom, 1 ngón để Pan (dịch chuyển góc)
    const handleMediaTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            pinchStartDist.current = dist;
            pinchStartScale.current = mediaScale;
            setIsPanningMedia(true);
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            panStartPos.current = {
                x: touch.clientX,
                y: touch.clientY,
                initialOffsetX: mediaOffset.x,
                initialOffsetY: mediaOffset.y
            };
            setIsPanningMedia(true);
        }
    };

    const handleMediaTouchMove = (e) => {
        if (!isPanningMedia) return;
        if (e.touches.length === 2 && pinchStartDist.current > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const ratio = dist / pinchStartDist.current;
            const newScale = Math.min(3.0, Math.max(0.8, pinchStartScale.current * ratio));
            setMediaScale(Number(newScale.toFixed(2)));
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - panStartPos.current.x;
            const dy = touch.clientY - panStartPos.current.y;
            setMediaOffset({
                x: Math.round(panStartPos.current.initialOffsetX + dx),
                y: Math.round(panStartPos.current.initialOffsetY + dy)
            });
        }
    };

    const handleMediaTouchEnd = () => {
        setIsPanningMedia(false);
        pinchStartDist.current = 0;
    };

    const handleMediaMouseDown = (e) => {
        panStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            initialOffsetX: mediaOffset.x,
            initialOffsetY: mediaOffset.y
        };
        setIsPanningMedia(true);

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - panStartPos.current.x;
            const dy = moveEvent.clientY - panStartPos.current.y;
            setMediaOffset({
                x: Math.round(panStartPos.current.initialOffsetX + dx),
                y: Math.round(panStartPos.current.initialOffsetY + dy)
            });
        };

        const onMouseUp = () => {
            setIsPanningMedia(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Bộ lắng nghe kéo thả cảm ứng & chuột mượt mà trên toàn màn hình (kể cả khi ngón tay lướt ra ngoài canvas)
    useEffect(() => {
        if (!draggingItem) return;

        const onMove = (e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const xPercent = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
            const yPercent = Math.max(10, Math.min(90, ((clientY - rect.top) / rect.height) * 100));

            if (draggingItem === 'sticker') {
                setStickerPos({ x: Math.round(xPercent), y: Math.round(yPercent) });
            } else if (draggingItem === 'text') {
                setTextPos({ x: Math.round(xPercent), y: Math.round(yPercent) });
            }
        };

        const onEnd = () => setDraggingItem(null);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };
    }, [draggingItem]);

    const handleCreateStory = async (event) => {
        if (event) event.preventDefault();
        if (!currentUser) return;
        const currentUserId = currentUser.user_id || currentUser.id;
        if (!currentUserId) {
            alert('Vui lòng đăng nhập để đăng Story.');
            return;
        }

        const hasMedia = !!storyFile;
        const hasPost = !!selectedStoryPost;
        const hasText = !!storyText.trim();
        const hasSticker = !!storySticker.trim();
        const hasMusic = !!storyMusic || !!selectedSpotifyTrack;

        if (!hasMedia && !hasPost && !hasText && !hasSticker && !hasMusic) {
            alert('Vui lòng thêm ảnh/video, văn bản, biểu tượng hoặc âm nhạc để chia sẻ.');
            return;
        }

        setIsSubmittingStory(true);
        try {
            const formData = new FormData();
            formData.append('user_id', currentUserId);

            let isCanvasBake = false;
            if (!hasMedia && !hasPost) {
                // Tạo ảnh nung từ canvas gradient + chữ + sticker
                const blob = await generateStoryCanvasBlob(
                    storyText,
                    storyTextColor,
                    storyTextBgMode,
                    STORY_GRADIENTS[storyBgIndex].colors,
                    storySticker,
                    textPos,
                    stickerPos,
                    storyTextFont,
                    storyTextAlign
                );
                if (blob) {
                    // Đính kèm trực tiếp Blob vào FormData (tương thích 100% với iOS Safari & Android WebViews không hỗ trợ new File)
                    formData.append('storyMedia', blob, 'story.png');
                    isCanvasBake = true;
                }
            } else if (hasMedia) {
                formData.append('storyMedia', storyFile);
            }

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
                stickerPos,
                text: storyText || '',
                textPos,
                textColor: storyTextColor,
                textBg: storyTextBgMode,
                textFont: storyTextFont,
                textAlign: storyTextAlign,
                gradientIndex: storyBgIndex,
                isCanvasBake,
                mediaTransform: {
                    scale: mediaScale,
                    offset: mediaOffset,
                    fit: mediaFit
                },
                videoTrim: storyFile?.type.startsWith('video/') ? {
                    startTime: videoStartTime,
                    endTime: videoEndTime || videoDuration,
                    duration: videoDuration,
                    isMuted: videoIsMuted
                } : null
            };
            formData.append('sticker', JSON.stringify(stickerPayload));

            const response = await safeFetch('/stories', { method: 'POST', body: formData });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Không thể đăng story.');
                return;
            }
            const createdStory = await response.json().catch(() => null);
            if (createdStory) {
                const formattedStory = {
                    ...createdStory,
                    username: currentUser?.username,
                    profile_photo_url: currentUser?.profile_photo_url,
                    poll: null
                };
                setStories(prev => [formattedStory, ...prev.filter(s => s.story_id !== createdStory.story_id)]);
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

    const handleCloseStoryViewer = () => {
        setActiveStory(null);
        setActiveStoryList([]);
        setActiveStoryIndex(0);
        setIsHoldingPause(false);
        isHoldingRef.current = false;
        clearTimeout(holdTimerRef.current);
    };

    const handleSelectStoryByIndex = (index, list = activeStoryList) => {
        if (!list || index < 0 || index >= list.length) {
            handleCloseStoryViewer();
            return;
        }
        const targetStory = list[index];
        setActiveStoryIndex(index);
        setActiveStory({
            ...targetStory,
            poll: null
        });
        setSelectedReaction(null);
        setStoryMenuOpen(false);
        setIsHoldingPause(false);
        isHoldingRef.current = false;
        clearTimeout(holdTimerRef.current);
        setIsScrubbing(false);
        setViewerCurrentTime(0);
        setViewerDuration(targetStory.media_type === 'video' ? 15 : 5);

        const currentUserId = currentUser?.user_id || currentUser?.id;
        if (currentUserId && Number(currentUserId) !== Number(targetStory.user_id)) {
            safeFetch(`/stories/${targetStory.story_id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            }).catch(() => {});
        }
    };

    const handleOpenStory = (story, customList = null) => {
        const listToUse = (customList && customList.length > 0) ? customList : stories;
        setActiveStoryList(listToUse);
        const targetIndex = listToUse.findIndex(s => s.story_id === story.story_id);
        const validIndex = targetIndex >= 0 ? targetIndex : 0;
        handleSelectStoryByIndex(validIndex, listToUse);
    };

    const handleNextStory = () => {
        if (activeStoryList && activeStoryIndex < activeStoryList.length - 1) {
            handleSelectStoryByIndex(activeStoryIndex + 1, activeStoryList);
        } else {
            handleCloseStoryViewer();
        }
    };

    const handlePrevStory = () => {
        if (activeStoryList && activeStoryIndex > 0) {
            handleSelectStoryByIndex(activeStoryIndex - 1, activeStoryList);
        }
    };

    // Nhấn giữ để tạm dừng Story & Video (chuẩn Instagram)
    const handleHoldStart = (e) => {
        if (e.target.closest('button, input, textarea, a, .story-reactions, .story-action-menu, .story-scrubber-bar, .story-close-button, .story-more-button, .story-nav-btn, .story-music-player, .spotify-embed-player')) {
            return;
        }
        holdStartTimeRef.current = Date.now();
        isHoldingRef.current = true;
        if (viewerVideoRef.current) {
            viewerVideoRef.current.pause();
        }
        if (viewerAudioRef.current) {
            viewerAudioRef.current.pause();
        }
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = setTimeout(() => {
            if (isHoldingRef.current) {
                setIsHoldingPause(true);
            }
        }, 150);
    };

    const handleHoldEnd = (e) => {
        if (!isHoldingRef.current) return;
        isHoldingRef.current = false;
        clearTimeout(holdTimerRef.current);
        const duration = Date.now() - holdStartTimeRef.current;

        // Luôn tiếp tục phát khi thả tay ra
        setIsHoldingPause(false);
        if (viewerVideoRef.current) {
            viewerVideoRef.current.play().catch(() => {});
        }
        if (viewerAudioRef.current) {
            viewerAudioRef.current.play().catch(() => {});
        }

        // Nếu chạm nhanh (< 250ms), đây là thao tác chạm trái / phải để chuyển tin
        if (duration < 250 && e) {
            const rect = e.currentTarget?.getBoundingClientRect();
            let clientX = e.clientX;
            if (clientX === undefined && e.changedTouches && e.changedTouches[0]) {
                clientX = e.changedTouches[0].clientX;
            }
            if (rect && clientX !== undefined) {
                const relativeX = clientX - rect.left;
                if (relativeX < rect.width * 0.35) {
                    handlePrevStory();
                } else {
                    handleNextStory();
                }
            }
        }
    };

    // Lắng nghe sự kiện thả tay toàn cục (ngăn chặn tình trạng thả tay ra ngoài màn hình bị kẹt dừng)
    useEffect(() => {
        const handleGlobalRelease = () => {
            if (isHoldingRef.current) {
                isHoldingRef.current = false;
                clearTimeout(holdTimerRef.current);
                setIsHoldingPause(false);
                if (viewerVideoRef.current) {
                    viewerVideoRef.current.play().catch(() => {});
                }
                if (viewerAudioRef.current) {
                    viewerAudioRef.current.play().catch(() => {});
                }
            }
        };
        window.addEventListener('pointerup', handleGlobalRelease);
        window.addEventListener('touchend', handleGlobalRelease);
        window.addEventListener('mouseup', handleGlobalRelease);
        return () => {
            window.removeEventListener('pointerup', handleGlobalRelease);
            window.removeEventListener('touchend', handleGlobalRelease);
            window.removeEventListener('mouseup', handleGlobalRelease);
        };
    }, []);

    // Điều khiển chuyển Story bằng phím mũi tên bàn phím (ArrowLeft, ArrowRight, Escape)
    useEffect(() => {
        if (!activeStory) return;
        const handleKeyDown = (e) => {
            if (e.target.closest('input, textarea')) return;
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNextStory();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevStory();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCloseStoryViewer();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeStory, activeStoryIndex, activeStoryList]);

    // Tự động chuyển Story dạng ảnh hoặc chữ sau 5 giây (chuẩn Instagram)
    useEffect(() => {
        if (!activeStory || activeStory.media_type === 'video') return;
        if (isHoldingPause) return;

        const timer = setInterval(() => {
            setViewerCurrentTime(prev => {
                const next = prev + 0.1;
                if (next >= (viewerDuration || 5)) {
                    handleNextStory();
                    return 0;
                }
                return next;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [activeStory, isHoldingPause, viewerDuration, activeStoryIndex, activeStoryList]);

    // Điều khiển tua tiến trình video
    const handleSeekChange = (e) => {
        const newTime = parseFloat(e.target.value);
        setViewerCurrentTime(newTime);
        if (viewerVideoRef.current) {
            viewerVideoRef.current.currentTime = newTime;
        }
    };

    const handleSkip = (seconds) => {
        if (!viewerVideoRef.current) return;
        let videoTrim = null;
        try {
            const p = JSON.parse(activeStory?.sticker || '{}');
            videoTrim = p.videoTrim || null;
        } catch {}
        const minT = videoTrim?.startTime || 0;
        const maxT = videoTrim?.endTime && videoTrim.endTime > 0 ? videoTrim.endTime : (viewerVideoRef.current.duration || viewerDuration || 15);
        const nextTime = Math.max(minT, Math.min(maxT, (viewerVideoRef.current.currentTime || 0) + seconds));
        viewerVideoRef.current.currentTime = nextTime;
        setViewerCurrentTime(nextTime);
    };

    const handleReactToStory = (reaction, event) => {
        const currentUserId = currentUser?.user_id || currentUser?.id;
        if (!currentUserId || !activeStory) {
            alert('Vui lòng đăng nhập để thả reaction.');
            return;
        }

        const id = Date.now() + Math.random();
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight - 90;
        if (event?.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top;
        }

        const randomOffset = (Math.random() - 0.5) * 50;
        const randomScale = 0.9 + Math.random() * 0.7;
        const randomRot = (Math.random() - 0.5) * 45;
        const randomDuration = 1.6 + Math.random() * 0.6;

        const newParticle = {
            id,
            emoji: reaction,
            x: startX + randomOffset,
            y: startY,
            scale: randomScale,
            rot: randomRot,
            duration: randomDuration
        };

        setFloatingStoryReactions(prev => [...prev.slice(-30), newParticle]);

        setTimeout(() => {
            setFloatingStoryReactions(prev => prev.filter(p => p.id !== id));
        }, randomDuration * 1000);

        setSelectedReaction(reaction);

        if (reactionDebounceTimer.current) clearTimeout(reactionDebounceTimer.current);
        reactionDebounceTimer.current = setTimeout(async () => {
            try {
                await safeFetch(`/stories/${activeStory.story_id}/react`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, reaction })
                });
            } catch (err) {
                console.error('Lỗi khi gửi reaction:', err);
            }
        }, 400);
    };

    const handleStartEditStory = () => {
        let parsedSticker = {};
        try {
            parsedSticker = JSON.parse(activeStory?.sticker || '{}');
        } catch {
            parsedSticker = { text: activeStory?.sticker || '' };
        }

        setEditingStory(activeStory);
        setStoryEditText(parsedSticker.text || '');
        setStoryEditEmoji(parsedSticker.sticker || '');
        setStoryEditTextColor(parsedSticker.textColor || '#ffffff');
        setStoryEditTextBgMode(parsedSticker.textBg || 'semi');
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
        if (event) event.preventDefault();
        if (!currentUser || !editingStory) return;
        const currentUserId = currentUser.user_id || currentUser.id;

        setIsUpdatingStory(true);
        const formData = new FormData();
        formData.append('user_id', currentUserId);

        let existingParsed = {};
        try {
            existingParsed = JSON.parse(editingStory.sticker || '{}');
        } catch {}

        const updatedStickerPayload = {
            ...existingParsed,
            text: storyEditText,
            textColor: storyEditTextColor,
            textBg: storyEditTextBgMode,
            sticker: storyEditEmoji
        };
        formData.append('sticker', JSON.stringify(updatedStickerPayload));

        if (storyEditFile) formData.append('storyMedia', storyEditFile);
        if (storyEditMusic) formData.append('storyMusic', storyEditMusic);
        if (removeStoryMusic) formData.append('removeMusic', 'true');
        if (removeSpotifyMusic) formData.append('removeSpotifyMusic', 'true');
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

        try {
            const response = await safeFetch(`/stories/${editingStory.story_id}`, {
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
            setRemoveSpotifyMusic(false);
            setSelectedSpotifyTrack(null);
            setSpotifyQuery('');
            setSpotifyResults([]);
            setStoryEditEmoji('');
            setStoryEditText('');
            alert('Cập nhật Story thành công!');
        } catch (err) {
            console.error('Lỗi sửa story:', err);
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            setIsUpdatingStory(false);
        }
    };

    const handleDeleteStory = async () => {
        if (!activeStory || !currentUser) return;
        const currentUserId = currentUser.user_id || currentUser.id;
        if (!window.confirm('Bạn có chắc muốn xóa story này không?')) return;
        try {
            const response = await safeFetch(`/stories/${activeStory.story_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            });
            const data = await response.json().catch(() => ({}));
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
                <main className={`app-feed-col ${isRightSidebarCollapsed ? 'expanded-full' : ''}`}>
                    {/* BĂNG CHUYỀN STORIES */}
                    <section className="story-bar-container">
                        <div className="story-scroll-track no-scrollbar">
                            {/* Nút đăng story hoặc xem story của người dùng hiện tại */}
                            {currentUser && (
                                <div
                                    className={`story-card-item story-create-item ${myStories.length > 0 ? 'has-active-stories' : ''}`}
                                    onClick={() => {
                                        if (myStories.length > 0) {
                                            handleOpenStory(myStories[0], myStories);
                                        } else {
                                            handleOpenCreateStory();
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    title={myStories.length > 0 ? 'Xem tin của bạn' : 'Tạo Story mới'}
                                >
                                    <div
                                        className={`story-avatar-wrapper ${myStories.length > 0 ? 'has-story-ring' : ''}`}
                                        style={myStories.length === 0 ? { background: 'var(--border-hover)' } : undefined}
                                    >
                                        <div className="story-avatar-inner">
                                            {myStories.length > 0 ? (
                                                myStories[0].media_type === 'video' ? (
                                                    <>
                                                        <video
                                                            src={mediaUrl(myStories[0].media_url)}
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                            className="story-thumb-media"
                                                        />
                                                        <div className="story-thumb-play-badge">
                                                            <Play size={11} fill="#ffffff" stroke="#ffffff" />
                                                        </div>
                                                    </>
                                                ) : myStories[0].media_url ? (
                                                    <img
                                                        src={mediaUrl(myStories[0].media_url)}
                                                        alt={currentUser?.username || 'Tin của bạn'}
                                                        className="story-thumb-media"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <Avatar user={currentUser} size={54} />
                                                )
                                            ) : (
                                                <Avatar user={currentUser} size={54} />
                                            )}
                                        </div>
                                        <span
                                            className="story-add-badge"
                                            title="Tạo Story mới"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCreateStory();
                                            }}
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                        </span>
                                    </div>
                                    <span className="story-username-label">
                                        {myStories.length > 0 ? 'Tin của bạn' : 'Tạo Story'}
                                    </span>
                                </div>
                            )}

                            {/* Danh sách story của bạn bè */}
                            {friendStories.map(story => {
                                let storyGradientVal = 'linear-gradient(135deg, #18181b, #09090b)';
                                let hasStickerText = '';
                                try {
                                    const parsed = JSON.parse(story.sticker || '{}');
                                    if (parsed.gradientIndex !== undefined && STORY_GRADIENTS[parsed.gradientIndex]) {
                                        storyGradientVal = STORY_GRADIENTS[parsed.gradientIndex].value;
                                    }
                                    hasStickerText = parsed.text || parsed.sticker || '';
                                } catch {}

                                return (
                                    <button
                                        key={story.story_id}
                                        type="button"
                                        onClick={() => handleOpenStory(story, friendStories)}
                                        className="story-card-item"
                                        title={`Story của ${story.username}`}
                                    >
                                        <div className="story-avatar-wrapper has-story-ring">
                                            <div className="story-avatar-inner">
                                                {story.media_type === 'video' ? (
                                                    <>
                                                        <video
                                                            src={mediaUrl(story.media_url)}
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                            className="story-thumb-media"
                                                        />
                                                        <div className="story-thumb-play-badge">
                                                            <Play size={11} fill="#ffffff" stroke="#ffffff" />
                                                        </div>
                                                    </>
                                                ) : story.media_url ? (
                                                    <img
                                                        src={mediaUrl(story.media_url)}
                                                        alt={story.username}
                                                        className="story-thumb-media"
                                                        loading="lazy"
                                                    />
                                                ) : story.shared_post?.photo_url ? (
                                                    <img
                                                        src={mediaUrl(story.shared_post.photo_url)}
                                                        alt={story.username}
                                                        className="story-thumb-media"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div
                                                        className="story-thumb-gradient"
                                                        style={{ background: storyGradientVal }}
                                                    >
                                                        <span>{hasStickerText ? hasStickerText.slice(0, 3) : 'Aa'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Huy hiệu avatar tác giả góc dưới */}
                                            <span className="story-author-mini-badge" title={story.username}>
                                                <Avatar
                                                    user={{ username: story.username, profile_photo_url: story.profile_photo_url }}
                                                    size={20}
                                                />
                                            </span>
                                        </div>
                                        <span className="story-username-label">{story.username}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* MODAL TẠO STORY KIỂU INSTAGRAM CHUYÊN NGHIỆP - TÁCH KHỎI THANH CUỘN */}
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
                                        {/* Crop & Zoom Tool */}
                                        {storyFile && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${activeStoryDrawer === 'crop' || mediaScale !== 1 || mediaOffset.x !== 0 || mediaOffset.y !== 0 ? 'active' : ''}`}
                                                    onClick={() => setActiveStoryDrawer(activeStoryDrawer === 'crop' ? null : 'crop')}
                                                    title="Thu phóng & Căn góc ảnh/video"
                                                >
                                                    <Crop size={20} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${mediaFit === 'contain' ? 'active' : ''}`}
                                                    onClick={() => setMediaFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                                                    title={mediaFit === 'cover' ? "Vừa màn hình (Fit)" : "Tràn khung 9:16 (Fill)"}
                                                >
                                                    {mediaFit === 'cover' ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
                                                </button>
                                            </>
                                        )}

                                        {/* Video Trimmer & Mute Tool */}
                                        {storyFile?.type.startsWith('video/') && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${activeStoryDrawer === 'trim' || (videoDuration > 0 && (videoStartTime > 0 || (videoEndTime > 0 && videoEndTime < videoDuration))) ? 'active' : ''}`}
                                                    onClick={() => setActiveStoryDrawer(activeStoryDrawer === 'trim' ? null : 'trim')}
                                                    title="Cắt độ dài video"
                                                >
                                                    <Scissors size={20} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`ig-story-tool-btn ${videoIsMuted ? 'active' : ''}`}
                                                    onClick={() => setVideoIsMuted(prev => !prev)}
                                                    title={videoIsMuted ? "Bật âm thanh video" : "Tắt âm thanh video"}
                                                >
                                                    {videoIsMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                                </button>
                                            </>
                                        )}

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

                                {/* Story Live Canvas with Touch/Mouse Drag & Drop */}
                                <div
                                    ref={canvasRef}
                                    className="ig-story-canvas"
                                    style={{
                                        background: storyFile ? '#000000' : STORY_GRADIENTS[storyBgIndex].value
                                    }}
                                    onMouseMove={handleCanvasMove}
                                    onTouchMove={handleCanvasMove}
                                    onMouseUp={handleDragEnd}
                                    onTouchEnd={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                >
                                    {/* Media File (Photo/Video) Preview with Zoom/Pan & Memoized URL */}
                                    {storyFile && (
                                        <div
                                            className="ig-story-media-layer"
                                            onTouchStart={handleMediaTouchStart}
                                            onTouchMove={handleMediaTouchMove}
                                            onTouchEnd={handleMediaTouchEnd}
                                            onMouseDown={handleMediaMouseDown}
                                        >
                                            {storyFile.type.startsWith('video/') ? (
                                                <video
                                                    ref={videoPreviewRef}
                                                    src={storyMediaPreviewUrl}
                                                    playsInline
                                                    autoPlay
                                                    loop
                                                    muted={videoIsMuted}
                                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                                    onTimeUpdate={handleVideoTimeUpdate}
                                                    style={{
                                                        transform: `scale(${mediaScale}) translate(${mediaOffset.x}px, ${mediaOffset.y}px)`,
                                                        objectFit: mediaFit,
                                                        transition: isPanningMedia ? 'none' : 'transform 0.15s ease'
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={storyMediaPreviewUrl}
                                                    alt="Story Media"
                                                    draggable={false}
                                                    style={{
                                                        transform: `scale(${mediaScale}) translate(${mediaOffset.x}px, ${mediaOffset.y}px)`,
                                                        objectFit: mediaFit,
                                                        transition: isPanningMedia ? 'none' : 'transform 0.15s ease'
                                                    }}
                                                />
                                            )}
                                            <div className="ig-story-media-quick-actions">
                                                {storyFile.type.startsWith('video/') && videoDuration > 0 && (
                                                    <span className="ig-story-media-badge-pill">
                                                        ⏱ {formatSeconds(videoStartTime)} - {formatSeconds(videoEndTime)}
                                                    </span>
                                                )}
                                                {mediaScale !== 1 && (
                                                    <span className="ig-story-media-badge-pill">
                                                        🔍 {Math.round(mediaScale * 100)}%
                                                    </span>
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

                                    {/* Draggable Floating Sticker */}
                                    {storySticker && (
                                        <div
                                            className={`ig-story-draggable ${draggingItem === 'sticker' ? 'is-dragging' : ''}`}
                                            style={{
                                                left: `${stickerPos.x}%`,
                                                top: `${stickerPos.y}%`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                            onMouseDown={e => handleDragStart('sticker', e)}
                                            onTouchStart={e => handleDragStart('sticker', e)}
                                        >
                                            <div className={`ig-story-draggable-wrapper ${draggingItem === 'sticker' ? 'ig-story-drag-halo' : ''}`}>
                                                {storySticker.startsWith('⏰') ? (
                                                    <div className="ig-time-sticker">
                                                        {storySticker.replace(/^⏰\s*/, '')}
                                                    </div>
                                                ) : storySticker.startsWith('📍') ? (
                                                    <div className="ig-location-sticker">
                                                        {storySticker}
                                                    </div>
                                                ) : (
                                                    <span className="ig-story-sticker-display">{storySticker}</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="ig-story-sticker-remove"
                                                    onClick={(e) => { e.stopPropagation(); setStorySticker(''); }}
                                                    title="Xóa nhãn dán"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <span className="ig-story-drag-badge">⠿ Kéo để di chuyển</span>
                                            </div>
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

                                    {/* Draggable Live Text Overlay & Input */}
                                    <div
                                        className={`ig-story-draggable ${draggingItem === 'text' ? 'is-dragging' : ''}`}
                                        style={{
                                            left: `${textPos.x}%`,
                                            top: `${textPos.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: '88%',
                                            maxWidth: '340px'
                                        }}
                                    >
                                        <div className={`ig-story-draggable-wrapper ${draggingItem === 'text' ? 'ig-story-drag-halo' : ''}`} style={{ width: '100%', flexDirection: 'column' }}>
                                            <div
                                                className="ig-story-drag-handle-bar"
                                                onMouseDown={e => handleDragStart('text', e)}
                                                onTouchStart={e => handleDragStart('text', e)}
                                                style={{ cursor: 'grab', display: 'flex', justifyContent: 'center', padding: '3px 0', opacity: 0.8 }}
                                                title="Chạm và giữ để kéo di chuyển"
                                            >
                                                <span className="ig-story-drag-badge" style={{ position: 'static', transform: 'none', opacity: 1 }}>⠿ Kéo để di chuyển</span>
                                            </div>
                                            <textarea
                                                value={storyText}
                                                onChange={e => setStoryText(e.target.value)}
                                                placeholder="Chạm để nhập văn bản..."
                                                className={`ig-story-textarea ig-font-${storyTextFont} ${storyTextBgMode === 'semi' ? 'has-bg' : storyTextBgMode === 'solid' ? 'has-solid-bg' : ''}`}
                                                style={{
                                                    color: storyTextBgMode === 'solid'
                                                        ? ((storyTextColor === '#000000' || storyTextColor === '#09090b') ? '#000000' : '#ffffff')
                                                        : storyTextColor,
                                                    background: storyTextBgMode === 'solid'
                                                        ? ((storyTextColor === '#000000' || storyTextColor === '#09090b') ? '#ffffff' : '#000000')
                                                        : (storyTextBgMode === 'semi' ? 'rgba(0, 0, 0, 0.65)' : 'transparent'),
                                                    textAlign: storyTextAlign
                                                }}
                                                rows={Math.max(1, (storyText.match(/\n/g) || []).length + 1)}
                                            />
                                        </div>
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

                                {/* Drawer 1: Text Options (Font, Alignment, Background, Color) */}
                                {activeStoryDrawer === 'text' && (
                                    <div className="ig-story-drawer">
                                        <div className="ig-story-drawer-header">
                                            <span>Định dạng chữ</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {/* Text Alignment */}
                                                <div className="ig-story-align-group">
                                                    <button
                                                        type="button"
                                                        className={`ig-story-align-btn ${storyTextAlign === 'left' ? 'active' : ''}`}
                                                        onClick={() => setStoryTextAlign('left')}
                                                        title="Căn trái"
                                                    >
                                                        <AlignLeft size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`ig-story-align-btn ${storyTextAlign === 'center' ? 'active' : ''}`}
                                                        onClick={() => setStoryTextAlign('center')}
                                                        title="Căn giữa"
                                                    >
                                                        <AlignCenter size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`ig-story-align-btn ${storyTextAlign === 'right' ? 'active' : ''}`}
                                                        onClick={() => setStoryTextAlign('right')}
                                                        title="Căn phải"
                                                    >
                                                        <AlignRight size={13} />
                                                    </button>
                                                </div>

                                                {/* Text Background Mode (Cycle None / Semi / Solid) */}
                                                <button
                                                    type="button"
                                                    className={`ig-story-text-bg-toggle ${storyTextBgMode !== 'none' ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const nextMode = storyTextBgMode === 'none' ? 'semi' : storyTextBgMode === 'semi' ? 'solid' : 'none';
                                                        setStoryTextBgMode(nextMode);
                                                        setStoryTextBg(nextMode !== 'none');
                                                    }}
                                                >
                                                    Nền: {storyTextBgMode === 'none' ? 'Tắt' : storyTextBgMode === 'semi' ? 'Mờ' : 'Đặc'}
                                                </button>

                                                <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                    Xong
                                                </button>
                                            </div>
                                        </div>

                                        {/* Font Style Switcher */}
                                        <div className="ig-story-font-switcher">
                                            {[
                                                { id: 'modern', label: 'Hiện đại' },
                                                { id: 'classic', label: 'Cổ điển' },
                                                { id: 'neon', label: 'Neon' },
                                                { id: 'typewriter', label: 'Đánh máy' },
                                                { id: 'strong', label: 'Mạnh mẽ' }
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    className={`ig-story-font-chip ${storyTextFont === f.id ? 'active' : ''} ig-font-${f.id}`}
                                                    onClick={() => setStoryTextFont(f.id)}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Color Palette */}
                                        <div className="ig-story-color-palette">
                                            {['#ffffff', '#000000', '#facc15', '#fb923c', '#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#22c55e'].map(col => (
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

                                {/* Drawer 2: Stickers & Interactive Emojis */}
                                {activeStoryDrawer === 'sticker' && (
                                    <div className="ig-story-drawer">
                                        <div className="ig-story-drawer-header">
                                            <span>Biểu tượng & Nhãn dán IG</span>
                                            <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                Xong
                                            </button>
                                        </div>

                                        {/* Quick Interactive Stickers */}
                                        <div className="ig-sticker-quick-row">
                                            <button
                                                type="button"
                                                className="ig-sticker-quick-pill"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                    setStorySticker(`⏰ ${timeStr}`);
                                                    setActiveStoryDrawer(null);
                                                }}
                                            >
                                                <Clock size={14} /> Giờ hiện tại
                                            </button>
                                            <button
                                                type="button"
                                                className="ig-sticker-quick-pill"
                                                onClick={() => {
                                                    setStorySticker('📍 Việt Nam');
                                                    setActiveStoryDrawer(null);
                                                }}
                                            >
                                                <MapPin size={14} /> Vị trí
                                            </button>
                                            <button
                                                type="button"
                                                className="ig-sticker-quick-pill"
                                                onClick={() => setActiveStoryDrawer('music')}
                                            >
                                                <Music2 size={14} /> Thêm bài hát
                                            </button>
                                        </div>

                                        {/* 32 Top Instagram Emojis */}
                                        <div className="ig-story-emoji-grid">
                                            {['🔥', '❤️', '✨', '😂', '😍', '👏', '💯', '⚡', '🎉', '🥳', '🍕', '🚀', '☕', '🌈', '💫', '👑', '💎', '🌸', '🦋', '🍻', '📸', '🌴', '🥑', '🌟', '💖', '🤩', '🤙', '🏖️', '🤍', '🖤', '🎯', '🥂'].map(em => (
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
                                                placeholder="Hoặc nhập sticker, emoji, địa điểm tùy ý..."
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

                                {/* Drawer 4: Crop, Zoom & Pan Framing */}
                                {activeStoryDrawer === 'crop' && storyFile && (
                                    <div className="ig-story-drawer ig-story-crop-drawer">
                                        <div className="ig-story-drawer-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Crop size={18} />
                                                <span>Cắt & Thu phóng khung hình</span>
                                            </div>
                                            <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                Xong
                                            </button>
                                        </div>

                                        <div className="ig-crop-controls-row">
                                            <span className="ig-crop-label">Thu phóng (Zoom): <strong>{Math.round(mediaScale * 100)}%</strong></span>
                                            <div className="ig-crop-zoom-actions">
                                                <button
                                                    type="button"
                                                    className="ig-crop-action-btn"
                                                    onClick={() => setMediaScale(prev => Math.max(0.8, Number((prev - 0.1).toFixed(2))))}
                                                    title="Thu nhỏ"
                                                >
                                                    <ZoomOut size={16} />
                                                </button>
                                                <input
                                                    type="range"
                                                    min={0.8}
                                                    max={3.0}
                                                    step={0.05}
                                                    value={mediaScale}
                                                    onChange={e => setMediaScale(Number(e.target.value))}
                                                    className="ig-crop-zoom-slider"
                                                />
                                                <button
                                                    type="button"
                                                    className="ig-crop-action-btn"
                                                    onClick={() => setMediaScale(prev => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
                                                    title="Phóng to"
                                                >
                                                    <ZoomIn size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="ig-crop-quick-toggles">
                                            <button
                                                type="button"
                                                className={`ig-crop-mode-btn ${mediaFit === 'cover' ? 'active' : ''}`}
                                                onClick={() => setMediaFit('cover')}
                                            >
                                                <Maximize2 size={14} /> Tràn khung 9:16 (Fill)
                                            </button>
                                            <button
                                                type="button"
                                                className={`ig-crop-mode-btn ${mediaFit === 'contain' ? 'active' : ''}`}
                                                onClick={() => setMediaFit('contain')}
                                            >
                                                <Minimize2 size={14} /> Vừa màn hình (Fit)
                                            </button>
                                            <button
                                                type="button"
                                                className="ig-crop-reset-btn"
                                                onClick={() => {
                                                    setMediaScale(1);
                                                    setMediaOffset({ x: 0, y: 0 });
                                                    setMediaFit('cover');
                                                }}
                                                title="Đặt lại mặc định"
                                            >
                                                <RotateCcw size={14} /> Đặt lại
                                            </button>
                                        </div>

                                        <p className="ig-crop-hint">
                                            💡 Mẹo: Chạm 2 ngón tay để zoom, hoặc giữ và kéo ảnh/video trên khung để dịch chuyển góc nhìn.
                                        </p>
                                    </div>
                                )}

                                {/* Drawer 5: Video Trimming */}
                                {activeStoryDrawer === 'trim' && storyFile?.type.startsWith('video/') && (
                                    <div className="ig-story-drawer ig-story-trim-drawer">
                                        <div className="ig-story-drawer-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Scissors size={18} />
                                                <span>Cắt độ dài video ({Math.max(1, Math.round(videoEndTime - videoStartTime))}s)</span>
                                            </div>
                                            <button type="button" onClick={() => setActiveStoryDrawer(null)} className="ig-story-drawer-close">
                                                Xong
                                            </button>
                                        </div>

                                        <div className="ig-trim-time-indicators">
                                            <span>Bắt đầu: <strong>{formatSeconds(videoStartTime)}</strong></span>
                                            <span>Kết thúc: <strong>{formatSeconds(videoEndTime)}</strong></span>
                                            <span>Tổng: <strong>{formatSeconds(videoDuration)}</strong></span>
                                        </div>

                                        <div className="ig-trim-sliders-wrap">
                                            <div className="ig-trim-slider-row">
                                                <label>Điểm bắt đầu:</label>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={Math.max(0, (videoDuration || 60) - 1)}
                                                    step={0.5}
                                                    value={videoStartTime}
                                                    onChange={e => handleStartTimeChange(e.target.value)}
                                                />
                                                <span>{formatSeconds(videoStartTime)}</span>
                                            </div>
                                            <div className="ig-trim-slider-row">
                                                <label>Điểm kết thúc:</label>
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={Math.max(1, videoDuration || 60)}
                                                    step={0.5}
                                                    value={videoEndTime}
                                                    onChange={e => handleEndTimeChange(e.target.value)}
                                                />
                                                <span>{formatSeconds(videoEndTime)}</span>
                                            </div>
                                        </div>

                                        <div className="ig-trim-presets">
                                            <button
                                                type="button"
                                                className={`ig-trim-preset-pill ${videoEndTime - videoStartTime <= 15.5 && videoEndTime - videoStartTime >= 14 ? 'active' : ''}`}
                                                onClick={() => {
                                                    setVideoStartTime(0);
                                                    setVideoEndTime(Math.min(15, videoDuration || 15));
                                                    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
                                                }}
                                            >
                                                15 giây
                                            </button>
                                            <button
                                                type="button"
                                                className={`ig-trim-preset-pill ${videoEndTime - videoStartTime <= 30.5 && videoEndTime - videoStartTime >= 29 ? 'active' : ''}`}
                                                onClick={() => {
                                                    setVideoStartTime(0);
                                                    setVideoEndTime(Math.min(30, videoDuration || 30));
                                                    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
                                                }}
                                            >
                                                30 giây
                                            </button>
                                            <button
                                                type="button"
                                                className="ig-trim-preset-pill"
                                                onClick={() => {
                                                    setVideoStartTime(0);
                                                    setVideoEndTime(videoDuration);
                                                    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
                                                }}
                                            >
                                                Toàn bộ video
                                            </button>
                                        </div>
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
                                        disabled={isSubmittingStory || (!storyFile && !selectedStoryPost && !storyText.trim() && !storySticker.trim() && !storyMusic && !selectedSpotifyTrack)}
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

                    {/* STORY VIEWER FULLSCREEN */}
                    {activeStory && (
                        <div className="story-viewer-backdrop" onClick={handleCloseStoryViewer}>
                            {/* Ambient Blur Background Layer */}
                            {activeStory.media_url && (
                                <div
                                    className="story-ambient-blur"
                                    style={{ backgroundImage: `url(${mediaUrl(activeStory.media_url)})` }}
                                />
                            )}

                            {/* Floating Reactions Particles Swarm Layer */}
                            <div className="story-floating-reactions-layer">
                                {floatingStoryReactions.map(p => (
                                    <span
                                        key={p.id}
                                        className="story-floating-particle"
                                        style={{
                                            left: `${p.x}px`,
                                            top: `${p.y}px`,
                                            fontSize: `${Math.round(32 * p.scale)}px`,
                                            animationDuration: `${p.duration}s`,
                                            '--particle-rot': `${p.rot}deg`
                                        }}
                                    >
                                        {p.emoji}
                                    </span>
                                ))}
                            </div>

                            <div
                                className={`story-viewer ${isHoldingPause ? 'is-holding-pause' : ''}`}
                                onClick={e => e.stopPropagation()}
                                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                                onMouseDown={handleHoldStart}
                                onMouseUp={handleHoldEnd}
                                onMouseLeave={handleHoldEnd}
                                onTouchStart={handleHoldStart}
                                onTouchEnd={handleHoldEnd}
                                onTouchCancel={handleHoldEnd}
                            >
                                {/* Nút điều hướng desktop Chevron Trái / Phải */}
                                {activeStoryIndex > 0 && (
                                    <button
                                        type="button"
                                        className="story-nav-btn story-nav-btn-prev"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrevStory();
                                        }}
                                        aria-label="Tin trước"
                                        title="Tin trước"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                )}
                                {activeStoryList && activeStoryIndex < activeStoryList.length - 1 && (
                                    <button
                                        type="button"
                                        className="story-nav-btn story-nav-btn-next"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNextStory();
                                        }}
                                        aria-label="Tin tiếp theo"
                                        title="Tin tiếp theo"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                )}

                                {/* Thanh tiến trình Instagram đa phân đoạn trên đầu */}
                                <div className="story-progress-container">
                                    {activeStoryList && activeStoryList.length > 1 ? (
                                        activeStoryList.map((storyItem, idx) => (
                                            <div key={storyItem.story_id || idx} className="story-progress-bar">
                                                <div
                                                    className={`story-progress-fill ${idx < activeStoryIndex ? 'completed' : ''}`}
                                                    style={{
                                                        width: idx < activeStoryIndex
                                                            ? '100%'
                                                            : idx === activeStoryIndex
                                                            ? `${viewerDuration > 0 ? Math.min(100, Math.max(0, (viewerCurrentTime / viewerDuration) * 100)) : 0}%`
                                                            : '0%'
                                                    }}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="story-progress-bar">
                                            <div
                                                className="story-progress-fill"
                                                style={{
                                                    width: `${viewerDuration > 0 ? Math.min(100, Math.max(0, (viewerCurrentTime / viewerDuration) * 100)) : 0}%`
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Huy hiệu hiển thị khi nhấn giữ tạm dừng */}
                                {isHoldingPause && (
                                    <div className="story-hold-pause-badge">
                                        <Pause size={13} fill="#ffffff" strokeWidth={0} />
                                        <span>Đang tạm dừng</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="story-close-button"
                                    onClick={handleCloseStoryViewer}
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

                                <div className="story-viewer-media-container" onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}>
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
                                                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                                                />
                                            )}
                                            <div className="story-shared-post-content">
                                                <strong>@{activeStory.shared_post.username}</strong>
                                                <p>{activeStory.shared_post.caption || 'Bài viết hình ảnh'}</p>
                                                <small>Nhấn để xem bài viết</small>
                                            </div>
                                        </button>
                                    ) : activeStory.media_type === 'video' ? (
                                        (() => {
                                            let videoTrim = null;
                                            let mediaTransform = null;
                                            try {
                                                const p = JSON.parse(activeStory.sticker || '{}');
                                                videoTrim = p.videoTrim || null;
                                                mediaTransform = p.mediaTransform || null;
                                            } catch {}
                                            return (
                                                <video
                                                    ref={viewerVideoRef}
                                                    src={mediaUrl(activeStory.media_url)}
                                                    autoPlay
                                                    playsInline
                                                    muted={videoTrim?.isMuted || false}
                                                    controlsList="nodownload nofullscreen noremoteplayback"
                                                    disablePictureInPicture
                                                    disableRemotePlayback
                                                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                                                    onEnded={handleNextStory}
                                                    style={{
                                                        objectFit: mediaTransform?.fit || 'contain',
                                                        transform: `scale(${mediaTransform?.scale || 1}) translate(${mediaTransform?.offset?.x || 0}px, ${mediaTransform?.offset?.y || 0}px)`
                                                    }}
                                                    onLoadedMetadata={e => {
                                                        const v = e.target;
                                                        const sTime = videoTrim?.startTime || 0;
                                                        const eTime = videoTrim?.endTime && videoTrim.endTime > 0 ? videoTrim.endTime : (v.duration || 15);
                                                        setViewerDuration(eTime);
                                                        if (sTime > 0) {
                                                            v.currentTime = sTime;
                                                        }
                                                        setViewerCurrentTime(sTime);
                                                    }}
                                                    onTimeUpdate={e => {
                                                        const v = e.target;
                                                        if (!isScrubbing) {
                                                            setViewerCurrentTime(v.currentTime);
                                                        }
                                                        if (videoTrim?.endTime && videoTrim.endTime > 0) {
                                                            if (v.currentTime >= videoTrim.endTime) {
                                                                handleNextStory();
                                                            }
                                                        }
                                                    }}
                                                />
                                            );
                                        })()
                                    ) : activeStory.media_url ? (
                                        (() => {
                                            let mediaTransform = null;
                                            try {
                                                const p = JSON.parse(activeStory.sticker || '{}');
                                                mediaTransform = p.mediaTransform || null;
                                            } catch {}
                                            return (
                                                <img
                                                    src={mediaUrl(activeStory.media_url)}
                                                    alt={`Story của ${activeStory.username}`}
                                                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                                                    style={{
                                                        objectFit: mediaTransform?.fit || 'contain',
                                                        transform: `scale(${mediaTransform?.scale || 1}) translate(${mediaTransform?.offset?.x || 0}px, ${mediaTransform?.offset?.y || 0}px)`
                                                    }}
                                                />
                                            );
                                        })()
                                    ) : (
                                        <div
                                            className="story-no-media-bg"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                background: (() => {
                                                    try {
                                                        const parsed = JSON.parse(activeStory.sticker);
                                                        if (parsed.gradientIndex !== undefined && STORY_GRADIENTS[parsed.gradientIndex]) {
                                                            return STORY_GRADIENTS[parsed.gradientIndex].value;
                                                        }
                                                    } catch {}
                                                    return '#000000';
                                                })()
                                            }}
                                        />
                                    )}

                                    {/* Text & Sticker with Dragged Position Parity */}
                                    {activeStory.sticker && (() => {
                                        try {
                                            const parsed = JSON.parse(activeStory.sticker);
                                            if (parsed.isCanvasBake && activeStory.media_url) {
                                                return null;
                                            }
                                            const isTimeSticker = parsed.sticker?.startsWith('⏰');
                                            const isLocSticker = parsed.sticker?.startsWith('📍');
                                            const fontClass = parsed.textFont ? `ig-font-${parsed.textFont}` : 'ig-font-modern';
                                            const bgClass = parsed.textBg === 'solid'
                                                ? 'has-solid-bg'
                                                : (parsed.textBg === true || parsed.textBg === 'semi') ? 'has-bg' : '';

                                            return (
                                                <>
                                                    {parsed.sticker && (
                                                        <div
                                                            className="story-sticker"
                                                            style={{
                                                                left: `${parsed.stickerPos?.x ?? 50}%`,
                                                                top: `${parsed.stickerPos?.y ?? 35}%`,
                                                                position: 'absolute',
                                                                transform: 'translate(-50%, -50%)',
                                                                zIndex: 12
                                                            }}
                                                        >
                                                            {isTimeSticker ? (
                                                                <span className="ig-time-sticker">{parsed.sticker.replace(/^⏰\s*/, '')}</span>
                                                            ) : isLocSticker ? (
                                                                <span className="ig-location-sticker">{parsed.sticker}</span>
                                                            ) : (
                                                                <span>{parsed.sticker}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {parsed.text && (
                                                        <div
                                                            className={`story-text-overlay ${fontClass} ${bgClass}`}
                                                            style={{
                                                                left: `${parsed.textPos?.x ?? 50}%`,
                                                                top: `${parsed.textPos?.y ?? 55}%`,
                                                                position: 'absolute',
                                                                transform: 'translate(-50%, -50%)',
                                                                color: parsed.textBg === 'solid'
                                                                    ? ((parsed.textColor === '#000000' || parsed.textColor === '#09090b') ? '#000000' : '#ffffff')
                                                                    : (parsed.textColor || '#ffffff'),
                                                                background: parsed.textBg === 'solid'
                                                                    ? ((parsed.textColor === '#000000' || parsed.textColor === '#09090b') ? '#ffffff' : '#000000')
                                                                    : (parsed.textBg === true || parsed.textBg === 'semi')
                                                                        ? 'rgba(0, 0, 0, 0.65)'
                                                                        : 'transparent',
                                                                textAlign: parsed.textAlign || 'center',
                                                                zIndex: 12
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
                                </div>

                                {activeStory.music_url && (
                                    <div className="story-music-player" onClick={e => e.stopPropagation()}>
                                        <Music2 size={15} />
                                        <span>{activeStory.music_name || 'Nhạc Story'}</span>
                                        <audio ref={viewerAudioRef} src={mediaUrl(activeStory.music_url)} controls autoPlay loop />
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

                                {/* Thanh Scrubber tua video chuẩn chuyên nghiệp */}
                                {activeStory.media_type === 'video' && (
                                    <div className="story-scrubber-bar" onClick={e => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className="story-seek-btn"
                                            onClick={() => handleSkip(-5)}
                                            title="Tua lùi 5 giây"
                                        >
                                            -5s
                                        </button>
                                        <div className="story-scrubber-track-wrap">
                                            <input
                                                type="range"
                                                className="story-scrubber-slider"
                                                min={(() => {
                                                    try {
                                                        const p = JSON.parse(activeStory.sticker || '{}');
                                                        return p.videoTrim?.startTime || 0;
                                                    } catch { return 0; }
                                                })()}
                                                max={(() => {
                                                    try {
                                                        const p = JSON.parse(activeStory.sticker || '{}');
                                                        return p.videoTrim?.endTime && p.videoTrim.endTime > 0 ? p.videoTrim.endTime : (viewerDuration || 15);
                                                    } catch { return viewerDuration || 15; }
                                                })()}
                                                step="0.1"
                                                value={viewerCurrentTime}
                                                onChange={handleSeekChange}
                                                onMouseDown={() => setIsScrubbing(true)}
                                                onTouchStart={() => setIsScrubbing(true)}
                                                onMouseUp={() => setIsScrubbing(false)}
                                                onTouchEnd={() => setIsScrubbing(false)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="story-seek-btn"
                                            onClick={() => handleSkip(5)}
                                            title="Tua tới 5 giây"
                                        >
                                            +5s
                                        </button>
                                        <span className="story-time-display">
                                            {formatSeconds(Math.max(0, viewerCurrentTime - (() => {
                                                try {
                                                    const p = JSON.parse(activeStory.sticker || '{}');
                                                    return p.videoTrim?.startTime || 0;
                                                } catch { return 0; }
                                            })()))} / {formatSeconds((() => {
                                                try {
                                                    const p = JSON.parse(activeStory.sticker || '{}');
                                                    const eT = p.videoTrim?.endTime && p.videoTrim.endTime > 0 ? p.videoTrim.endTime : viewerDuration;
                                                    const sT = p.videoTrim?.startTime || 0;
                                                    return Math.max(1, eT - sT);
                                                } catch { return viewerDuration || 15; }
                                            })())}
                                        </span>
                                    </div>
                                )}

                                {/* Animated Spammable Reactions Bar */}
                                <div className="story-reactions" onClick={e => e.stopPropagation()}>
                                    {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(reaction => (
                                        <button
                                            type="button"
                                            key={reaction}
                                            className={`story-reaction-btn ${selectedReaction === reaction ? 'selected' : ''}`}
                                            onClick={(e) => handleReactToStory(reaction, e)}
                                            aria-label={`Thả ${reaction}`}
                                            title={`Thả ${reaction}`}
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
                                        ) : storyEditFile ? (
                                            storyEditFile.type.startsWith('video/')
                                                ? <video src={storyEditMediaPreviewUrl} controls />
                                                : <img src={storyEditMediaPreviewUrl} alt="Xem trước story mới" />
                                        ) : (
                                            editingStory.media_type === 'video'
                                                ? <video src={mediaUrl(editingStory.media_url)} controls />
                                                : editingStory.media_url
                                                    ? <img src={mediaUrl(editingStory.media_url)} alt="Story hiện tại" />
                                                    : (
                                                        <div
                                                            className="story-no-media-bg"
                                                            style={{
                                                                width: '100%',
                                                                height: '240px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: (() => {
                                                                    try {
                                                                        const parsed = JSON.parse(editingStory.sticker);
                                                                        if (parsed.gradientIndex !== undefined && STORY_GRADIENTS[parsed.gradientIndex]) {
                                                                            return STORY_GRADIENTS[parsed.gradientIndex].value;
                                                                        }
                                                                    } catch {}
                                                                    return '#000000';
                                                                })()
                                                            }}
                                                        >
                                                            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{storyEditText || 'Story văn bản'}</span>
                                                        </div>
                                                    )
                                        )}
                                    </div>

                                    {/* Sửa nội dung văn bản Story */}
                                    <label className="story-edit-label">Nội dung văn bản Story</label>
                                    <textarea
                                        value={storyEditText}
                                        onChange={e => setStoryEditText(e.target.value)}
                                        placeholder="Nhập nội dung văn bản cho story..."
                                        rows={3}
                                    />

                                    {/* Sửa Sticker / Biểu tượng */}
                                    <label className="story-edit-label">Biểu tượng & Sticker</label>
                                    <input
                                        value={storyEditEmoji}
                                        onChange={e => setStoryEditEmoji(e.target.value)}
                                        placeholder="Nhập biểu tượng (ví dụ: 🔥, ❤️, 📍 Sài Gòn, ⏰ 08:30)..."
                                    />
                                    <div className="story-edit-emoji-chips">
                                        {['🔥', '❤️', '😂', '🎉', '👏', '😍', '✨', '☕', '💯'].map(em => (
                                            <button
                                                type="button"
                                                key={em}
                                                className={`story-edit-emoji-chip ${storyEditEmoji === em ? 'active' : ''}`}
                                                onClick={() => setStoryEditEmoji(prev => prev === em ? '' : em)}
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="story-edit-upload">
                                        Đổi ảnh hoặc video mới
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
                                    <button type="submit" className="story-edit-submit" disabled={isUpdatingStory}>
                                        {isUpdatingStory ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
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
                                                <span className="ig-suggested-reason" title={user.suggestion_reason || 'Gợi ý cho bạn'}>
                                                    {user.suggestion_reason || 'Gợi ý cho bạn'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className={`ig-suggested-action-btn ${followedSuggestionIds.has(Number(user.user_id)) ? 'sent' : ''}`}
                                                onClick={(e) => handleFollowSuggestion(user.user_id, e)}
                                            >
                                                {followedSuggestionIds.has(Number(user.user_id)) ? (
                                                    <>
                                                        <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                                        Đang theo dõi
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                                        Theo dõi
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* THANH ĐIỀU KHIỂN & BỘ LỌC THỂ LOẠI BEHANCE GRID */}
                    <div className="behance-feed-control-bar">
                        <div className="behance-filter-chips no-scrollbar">
                            {[
                                { id: 'all', label: '🌟 Tất cả' },
                                { id: 'Thiết kế đồ họa', label: '🎨 Đồ họa' },
                                { id: 'UI/UX Design', label: '📱 UI/UX' },
                                { id: '3D & Hoạt hình', label: '🧊 3D Art' },
                                { id: 'Minh họa & Art', label: '🖌️ Minh họa' },
                                { id: 'Nhiếp ảnh', label: '📸 Nhiếp ảnh' },
                                { id: 'Branding & Logo', label: '✨ Branding' }
                            ].map(cat => (
                                <button
                                    type="button"
                                    key={cat.id}
                                    className={`behance-filter-chip ${feedFilterCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setFeedFilterCategory(cat.id)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="behance-feed-mode-actions">
                            <button
                                type="button"
                                className={`feed-mode-toggle-btn ${feedDisplayMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setFeedDisplayMode('grid')}
                                title="Lưới tác phẩm Behance"
                            >
                                <LayoutGrid size={15} />
                                <span className="mode-text">Lưới</span>
                            </button>
                            <button
                                type="button"
                                className={`feed-mode-toggle-btn ${feedDisplayMode === 'timeline' ? 'active' : ''}`}
                                onClick={() => setFeedDisplayMode('timeline')}
                                title="Dòng thời gian"
                            >
                                <List size={15} />
                                <span className="mode-text">Bài viết</span>
                            </button>

                            <button
                                type="button"
                                className={`feed-sidebar-toggle-btn ${isRightSidebarCollapsed ? 'active' : ''}`}
                                onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                                title={isRightSidebarCollapsed ? 'Hiện cột gợi ý' : 'Bung rộng 100% không gian'}
                            >
                                {isRightSidebarCollapsed ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* DANH SÁCH BÀI VIẾT: GRID HOẶC TIMELINE */}
                    {feedDisplayMode === 'grid' ? (
                        <div className="behance-grid-feed">
                            {filteredPosts && filteredPosts.length > 0 ? (
                                filteredPosts.map(post => (
                                    <ProjectCard
                                        key={post.post_id || post.id}
                                        post={post}
                                        onOpenModal={(p) => setSelectedProject(p)}
                                        onLike={onLike}
                                    />
                                ))
                            ) : (
                                <div className="empty-feed-card" style={{ gridColumn: '1 / -1' }}>
                                    <div className="empty-feed-icon-wrap">
                                        <Layers size={32} color="#0095f6" />
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                                        Chưa có tác phẩm nào trong mục này
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
                                        Hãy là người đầu tiên đăng dự án hoặc chọn xem "Tất cả" để khám phá thêm!
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setFeedFilterCategory('all')}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: '999px',
                                            background: 'var(--accent-gradient, #3b82f6)',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Xem tất cả tác phẩm
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredPosts && filteredPosts.length > 0 ? (
                                filteredPosts.map(post => (
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
                                        Chào mừng bạn đến với NovaGen 🎨
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                                        Hãy theo dõi hoặc kết bạn với các tài khoản để xem các bài viết mới nhất!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* MODAL XEM CHI TIẾT TÁC PHẨM TRÀN VIỀN BEHANCE (70% - 30%) */}
                {selectedProject && (
                    <ProjectDetailModal
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                        onLike={(postId) => {
                            if (onLike) onLike(postId);
                            setSelectedProject(prev => prev ? {
                                ...prev,
                                isLiked: !prev.isLiked,
                                likes: prev.isLiked ? Math.max(0, (prev.likes || 1) - 1) : (prev.likes || 0) + 1
                            } : null);
                        }}
                        onCommentSubmit={(postId, text) => {
                            if (onCommentSubmit) onCommentSubmit(postId, text);
                            setSelectedProject(prev => prev ? {
                                ...prev,
                                comments: [
                                    ...(prev.comments || []),
                                    {
                                        comment_id: 'temp-' + Date.now(),
                                        comment_text: text,
                                        created_at: new Date().toISOString(),
                                        user_id: currentUser?.user_id,
                                        username: currentUser?.username,
                                        profile_photo_url: currentUser?.profile_photo_url,
                                        is_verified: currentUser?.is_verified
                                    }
                                ]
                            } : null);
                        }}
                    />
                )}

                {/* CỘT PHẢI: GỢI Ý KẾT BẠN & VIỆC LÀM CREATIVE (TỰ ĐỘNG ẨN KHI THU GỌN) */}
                {!isRightSidebarCollapsed && (
                    <aside className="app-widget-col">
                        {/* WIDGET 1: GỢI Ý KẾT BẠN */}
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
                                                        <div className="suggestion-subtitle" style={{ color: '#38bdf8', fontWeight: 500, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={user.suggestion_reason || 'Gợi ý cho bạn'}>
                                                            {user.suggestion_reason || 'Gợi ý cho bạn'}
                                                        </div>
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

                        {/* WIDGET 2: VIỆC LÀM & CƠ HỘI HỢP TÁC CREATIVE */}
                        <div className="widget-card creative-jobs-widget">
                            <div className="widget-title">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={18} color="#34d399" />
                                    Cơ hội việc làm & Dự án
                                </span>
                            </div>
                            <div className="creative-jobs-list">
                                <div className="creative-job-item">
                                    <div className="creative-job-header">
                                        <span className="job-tag hot">HOT</span>
                                        <span className="job-salary">25 - 40 triệu</span>
                                    </div>
                                    <div className="job-title">Senior UI/UX Designer (FinTech)</div>
                                    <div className="job-company">Remote / Toàn thời gian</div>
                                </div>
                                <div className="creative-job-item">
                                    <div className="creative-job-header">
                                        <span className="job-tag freelance">FREELANCE</span>
                                        <span className="job-salary">15 - 20 triệu</span>
                                    </div>
                                    <div className="job-title">3D Motion Graphic Video 60s</div>
                                    <div className="job-company">Theo dự án • Deadline 2 tuần</div>
                                </div>
                                <div className="creative-job-item">
                                    <div className="creative-job-header">
                                        <span className="job-tag branding">BRAND</span>
                                        <span className="job-salary">Thỏa thuận</span>
                                    </div>
                                    <div className="job-title">Bộ nhận diện Visual Brand Identity</div>
                                    <div className="job-company">Hà Nội / HCM • Hợp đồng</div>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}

                <ChatWidget />
            </div>
        </div>
    );
}