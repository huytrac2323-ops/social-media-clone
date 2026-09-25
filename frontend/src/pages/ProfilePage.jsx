import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/App.css';
import EditProfileModal from '../modals/EditProfileModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectDetailModal from '../modals/ProjectDetailModal.jsx';
import PostCard from '../components/PostCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import SidebarNav from '../components/SidebarNav.jsx';
import Avatar from '../components/Avatar.jsx';
import ProfileMenuModal from '../components/ProfileMenuModal.jsx';
import RequestVerificationModal from '../modals/RequestVerificationModal.jsx';
import { safeFetch, getApiBaseUrl } from '../utils/api';
import {
  Grid,
  Bookmark,
  Tag,
  Edit3,
  MessageCircle,
  UserPlus,
  UserCheck,
  Lock,
  Heart,
  Users,
  X,
  Menu,
  RotateCw,
  WifiOff,
  Plus,
  MapPin,
  Home,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Clock,
  LayoutGrid,
  List,
  Crown
} from 'lucide-react';

const API_URL = getApiBaseUrl();

const CREATOR_LABELS = {
  illustrator:  { emoji: '🎨', label: 'Họa sĩ / Minh họa', desc: 'Vẽ tranh, Digital Art, Anime & Nghệ thuật thị giác' },
  photographer: { emoji: '📸', label: 'Nhiếp ảnh gia', desc: 'Chuyên gia chụp ảnh phong cảnh, chân dung & sự kiện' },
  musician:     { emoji: '🎵', label: 'Nhạc sĩ / Ca sĩ', desc: 'Sáng tác nhạc, biểu diễn, beatmaker & âm thanh' },
  videographer: { emoji: '🎬', label: 'Làm phim / Video', desc: 'Sáng tạo nội dung video, YouTuber, dựng phim & vlog' },
  writer:       { emoji: '✍️',  label: 'Nhà văn / Tác giả', desc: 'Sáng tác tiểu thuyết, tản văn, thơ & copywriting' },
  dancer:       { emoji: '💃', label: 'Vũ công / Biên đạo', desc: 'Biểu diễn nhảy, biên đạo múa nghệ thuật & phong cách sống' },
  designer:     { emoji: '🖥️', label: 'Thiết kế đồ họa', desc: 'UI/UX, Typography, 3D, Brand Identity & Kiến trúc' },
  gamer:        { emoji: '🎮', label: 'Game Creator / Streamer', desc: 'Stream game, phân tích Esports & đánh giá Gaming' },
  crafter:      { emoji: '🧶', label: 'Thủ công mỹ nghệ', desc: 'DIY, Handmade, Gốm sứ, Đan len & Nghệ thuật tạo hình' },
  other:        { emoji: '✨', label: 'Sáng tạo nội dung', desc: 'Nhà sáng tạo đa lĩnh vực, phong cách sống & truyền cảm hứng' }
};

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const API_URL = getApiBaseUrl();
  const mediaUrl = (url) => !url ? '' : url.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' (Tác phẩm) | 'timeline' (Dòng thời gian) | 'saved'
  const [selectedProject, setSelectedProject] = useState(null);
  const [friends, setFriends] = useState([]);
  const [followStatus, setFollowStatus] = useState(null);
  const [retryStatus, setRetryStatus] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Story & Highlights States
  const [userActiveStories, setUserActiveStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightCover, setNewHighlightCover] = useState('');
  const [selectedHighlightPostId, setSelectedHighlightPostId] = useState(null);
  const [activeStoryViewer, setActiveStoryViewer] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Điều hướng an toàn nếu username không hợp lệ hoặc 'undefined'/'null'
  useEffect(() => {
    const isInvalid = !username || username === 'undefined' || username === 'null';
    if (isInvalid) {
      const fallbackUsername = (currentUser?.username && currentUser.username !== 'null' && currentUser.username !== 'undefined')
        ? currentUser.username
        : (currentUser?.user?.username && currentUser.user.username !== 'null' && currentUser.user.username !== 'undefined')
          ? currentUser.user.username
          : (currentUser?.user_id || currentUser?.id);
      if (fallbackUsername) {
        navigate(`/profile/${encodeURIComponent(fallbackUsername)}`, { replace: true });
      } else if (!currentUser) {
        navigate('/login', { replace: true });
      }
    }
  }, [username, currentUser, navigate]);

  const fetchUserProfile = useCallback(async (attempt = 1) => {
    if (!username || username === 'undefined' || username === 'null') return;

    if (attempt === 1) {
      setLoading(true);
      setError(null);
      setRetryStatus('');
    } else {
      setIsRetrying(true);
      setRetryStatus(`Máy chủ đang kết nối lại... (lần ${attempt}/2)`);
    }

    try {
      const viewerParam = currentUser?.user_id ? `?viewer_id=${currentUser.user_id}` : '';
      let response = await safeFetch(`/users/${encodeURIComponent(username)}${viewerParam}`);

      if (!response.ok) {
        // Cố gắng tự động sửa lỗi case-insensitive hoặc ID người dùng nếu backend trả 404
        if (response.status === 404) {
          try {
            const listRes = await safeFetch('/users');
            if (listRes.ok) {
              const allUsers = await listRes.json();
              const matchedUser = allUsers.find(u =>
                (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
                (String(u.user_id) === String(username))
              );
              if (matchedUser) {
                if (matchedUser.username && matchedUser.username !== username) {
                  navigate(`/profile/${encodeURIComponent(matchedUser.username)}`, { replace: true });
                  const retryRes = await safeFetch(`/users/${encodeURIComponent(matchedUser.username)}${viewerParam}`);
                  if (retryRes.ok) {
                    const retryData = await retryRes.json();
                    setUserProfile(retryData);
                    setError(null);
                    setRetryStatus('');
                    setLoading(false);
                    setIsRetrying(false);
                    return;
                  }
                }
                
                // Nếu tìm thấy người dùng trong danh sách nhưng gọi endpoint chi tiết không được
                setUserProfile({
                  user_id: matchedUser.user_id,
                  username: matchedUser.username || currentUser?.username || 'Người dùng',
                  profile_photo_url: matchedUser.profile_photo_url,
                  bio: matchedUser.bio || '',
                  is_private: Boolean(matchedUser.is_private),
                  is_verified: Boolean(matchedUser.is_verified),
                  creator_type: matchedUser.creator_type || null,
                  posts: [],
                  stats: { post_count: 0, follower_count: 0, following_count: 0 }
                });
                setError(null);
                setRetryStatus('');
                setLoading(false);
                setIsRetrying(false);
                return;
              }
            }
          } catch (lookupErr) {
            console.warn('Lỗi tra cứu người dùng dự phòng:', lookupErr);
          }

          // Dự phòng đặc biệt: Nếu người dùng đang xem trang của chính mình
          const isViewingSelf = currentUser && (
            String(currentUser.user_id) === String(username) ||
            String(currentUser.id) === String(username) ||
            (currentUser.username && currentUser.username.toLowerCase() === username.toLowerCase())
          );
          if (isViewingSelf) {
            setUserProfile({
              user_id: currentUser.user_id || currentUser.id,
              username: currentUser.username || 'Người dùng',
              profile_photo_url: currentUser.profile_photo_url || currentUser.avatar || null,
              bio: currentUser.bio || '',
              is_private: Boolean(currentUser.is_private),
              is_verified: Boolean(currentUser.is_verified),
              creator_type: currentUser.creator_type || null,
              posts: [],
              stats: { post_count: 0, follower_count: 0, following_count: 0 }
            });
            setError(null);
            setRetryStatus('');
            setLoading(false);
            setIsRetrying(false);
            return;
          }
        }

        let errMessage = 'Không tìm thấy người dùng.';
        try {
          const errData = await response.json();
          if (errData?.message) errMessage = errData.message;
        } catch {
          const rawText = await response.text();
          if (rawText) errMessage = rawText;
        }
        throw new Error(errMessage);
      }
      const data = await response.json();
      // Đảm bảo username hiển thị hợp lệ
      if (!data.username && currentUser?.user_id === data.user_id) {
        data.username = currentUser.username || 'Người dùng';
      }
      setUserProfile(data);
      setError(null);
      setRetryStatus('');
      setLoading(false);
      setIsRetrying(false);
    } catch (err) {
      console.error(`Lỗi khi tải hồ sơ (lần ${attempt}):`, err);
      const isNetworkError =
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Load failed') ||
        err.message?.includes('network');

      // Tự động thử lại 1 lần nếu gặp lỗi mạng
      if (isNetworkError && attempt < 2) {
        setRetryStatus('Đang tự động thử kết nối lại máy chủ sau 2s...');
        setTimeout(() => {
          fetchUserProfile(attempt + 1);
        }, 2000);
        return;
      }

      // Nếu là chính chủ mà bị lỗi, vẫn cho vào profile dạng offline
      const isViewingSelf = currentUser && (
        String(currentUser.user_id) === String(username) ||
        String(currentUser.id) === String(username) ||
        (currentUser.username && currentUser.username.toLowerCase() === username.toLowerCase())
      );
      if (isViewingSelf) {
        setUserProfile({
          user_id: currentUser.user_id || currentUser.id,
          username: currentUser.username || 'Người dùng',
          profile_photo_url: currentUser.profile_photo_url || currentUser.avatar || null,
          bio: currentUser.bio || '',
          is_private: Boolean(currentUser.is_private),
          is_verified: Boolean(currentUser.is_verified),
          creator_type: currentUser.creator_type || null,
          posts: [],
          stats: { post_count: 0, follower_count: 0, following_count: 0 }
        });
        setError(null);
      } else if (isNetworkError) {
        setError('Không thể kết nối đến máy chủ. Vui lòng bấm "Thử lại".');
      } else {
        setError(err.message || 'Không tìm thấy người dùng.');
      }
      setLoading(false);
      setIsRetrying(false);
      setRetryStatus('');
    }
  }, [username, currentUser, navigate]);

  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await safeFetch(`/friends/${userId}/list`);
      if (!response.ok) throw new Error('Không thể tải danh sách bạn bè.');
      setFriends(await response.json());
    } catch (err) {
      console.error('Lỗi khi lấy danh sách bạn bè:', err);
      setFriends([]);
    }
  }, []);

  const fetchFollowStatus = useCallback(async (followeeId) => {
    if (!currentUser?.user_id || !followeeId || String(currentUser.user_id) === String(followeeId)) return;
    try {
      const response = await safeFetch(`/friends/follow-status/${currentUser.user_id}/${followeeId}`);
      if (!response.ok) throw new Error('Không thể tải trạng thái theo dõi.');
      setFollowStatus(await response.json());
    } catch (err) {
      console.error('Lỗi khi lấy trạng thái theo dõi:', err);
      setFollowStatus(null);
    }
  }, [currentUser]);

  const fetchUserStoriesAndHighlights = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const [storyRes, hlRes] = await Promise.all([
        safeFetch(`/stories/user/${userId}`),
        safeFetch(`/stories/highlights/${userId}`)
      ]);
      if (storyRes.ok) {
        const stories = await storyRes.json();
        setUserActiveStories(Array.isArray(stories) ? stories : []);
      }
      if (hlRes.ok) {
        const hls = await hlRes.json();
        setHighlights(Array.isArray(hls) ? hls : []);
      }
    } catch (err) {
      console.warn('Lỗi tải story/highlights của người dùng:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchFriends(userProfile.user_id);
      fetchFollowStatus(userProfile.user_id);
      fetchUserStoriesAndHighlights(userProfile.user_id);
    }
  }, [fetchFriends, fetchFollowStatus, fetchUserStoriesAndHighlights, userProfile?.user_id]);

  const [isHoldingPause, setIsHoldingPause] = useState(false);
  const [viewerDuration, setViewerDuration] = useState(6);
  const [viewerCurrentTime, setViewerCurrentTime] = useState(0);
  const profileViewerVideoRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const isHoldingRef = useRef(false);
  const holdTimerRef = useRef(null);

  const handleNextStory = useCallback(() => {
    if (!activeStoryViewer) return;
    if (activeStoryIndex < activeStoryViewer.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
      setViewerCurrentTime(0);
    } else {
      setActiveStoryViewer(null);
      setViewerCurrentTime(0);
    }
  }, [activeStoryViewer, activeStoryIndex]);

  const handlePrevStory = useCallback(() => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
      setViewerCurrentTime(0);
    }
  }, [activeStoryIndex]);

  const handleHoldStart = (e) => {
    if (e.target.closest('button, input, textarea, a, .story-close-button, .story-nav-btn')) {
      return;
    }
    holdStartTimeRef.current = Date.now();
    isHoldingRef.current = true;
    if (profileViewerVideoRef.current) {
      profileViewerVideoRef.current.pause();
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

    setIsHoldingPause(false);
    if (profileViewerVideoRef.current) {
      profileViewerVideoRef.current.play().catch(() => {});
    }

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

  useEffect(() => {
    const handleGlobalRelease = () => {
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        clearTimeout(holdTimerRef.current);
        setIsHoldingPause(false);
        if (profileViewerVideoRef.current) {
          profileViewerVideoRef.current.play().catch(() => {});
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

  useEffect(() => {
    if (!activeStoryViewer || isHoldingPause) return;
    const currentItem = activeStoryViewer[activeStoryIndex];
    if (currentItem?.media_type === 'video') return;

    setViewerDuration(6);
    const timer = setInterval(() => {
      setViewerCurrentTime(prev => {
        if (prev >= 6) {
          handleNextStory();
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [activeStoryViewer, activeStoryIndex, isHoldingPause, handleNextStory]);

  const handleAvatarClick = () => {
    if (userActiveStories && userActiveStories.length > 0) {
      setActiveStoryViewer(userActiveStories);
      setActiveStoryIndex(0);
      setViewerCurrentTime(0);
    } else if (currentUser && Number(currentUser.user_id) === Number(userProfile?.user_id)) {
      setShowCreatePost(true);
    }
  };

  useEffect(() => {
    if (!activeStoryViewer) return;
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
        setActiveStoryViewer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryViewer, handleNextStory, handlePrevStory]);

  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!currentUser?.user_id || !newHighlightTitle.trim()) {
      alert('Vui lòng nhập tên tin nổi bật!');
      return;
    }
    try {
      let cover = newHighlightCover.trim();
      let storiesPayload = [];
      if (selectedHighlightPostId) {
        const matchedPost = userProfile?.posts?.find(p => p.post_id === selectedHighlightPostId);
        if (matchedPost) {
          cover = cover || matchedPost.photo_url;
          storiesPayload.push({
            media_url: matchedPost.photo_url,
            media_type: 'image',
            caption: matchedPost.caption
          });
        }
      }
      if (!cover && userActiveStories.length > 0) {
        cover = userActiveStories[0].media_url;
        storiesPayload = userActiveStories;
      }
      const response = await safeFetch('/stories/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          title: newHighlightTitle.trim(),
          cover_url: cover || null,
          stories: storiesPayload
        })
      });
      if (!response.ok) throw new Error('Không thể tạo tin nổi bật');
      const created = await response.json();
      setHighlights(prev => [created, ...prev]);
      setIsCreateHighlightOpen(false);
      setNewHighlightTitle('');
      setNewHighlightCover('');
      setSelectedHighlightPostId(null);
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo tin nổi bật.');
    }
  };

  const handleDeleteHighlight = async (highlightId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nổi bật này?')) return;
    try {
      const response = await safeFetch(`/stories/highlights/${highlightId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
      if (response.ok) {
        setHighlights(prev => prev.filter(h => h.highlight_id !== highlightId));
      }
    } catch (err) {
      console.error('Lỗi khi xóa tin nổi bật:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.user_id || !userProfile?.user_id) return;
    const isCurrentlyFollowing = Boolean(followStatus?.is_following);
    const endpoint = isCurrentlyFollowing
      ? `/friends/follow/${currentUser.user_id}/${userProfile.user_id}`
      : `/friends/follow`;

    const prevStatus = followStatus;
    // Cập nhật giao diện tức thì (Optimistic UI) - theo dõi trực tiếp không cần yêu cầu
    setFollowStatus({ ...prevStatus, is_following: !isCurrentlyFollowing, request_sent: false });

    try {
      const response = await safeFetch(endpoint, {
        method: isUnfollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isUnfollowing
          ? undefined
          : JSON.stringify({ follower_id: currentUser.user_id, followee_id: userProfile.user_id })
      });
      const data = await response.json();
      if (!response.ok) {
        setFollowStatus(prevStatus);
        alert(data.message || 'Không thể cập nhật theo dõi.');
        return;
      }
      await fetchFollowStatus(userProfile.user_id);
      await fetchUserProfile();
    } catch (err) {
      setFollowStatus(prevStatus);
      console.error('Lỗi theo dõi:', err);
      alert('Không thể kết nối máy chủ.');
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-layout">
          <SidebarNav onCreatePost={() => setShowCreatePost(true)} />
          <main style={{ flex: 1, maxWidth: '900px', minWidth: 0, paddingBottom: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '24px' }}>
              <RotateCw className="spin-animation" size={36} color="var(--accent-blue, #0095f6)" />
              <div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main, #ffffff)', marginBottom: '6px' }}>
                  {retryStatus ? 'Đang kết nối lại máy chủ...' : 'Đang tải hồ sơ...'}
                </p>
                {retryStatus && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted, #a8a8a8)', maxWidth: '380px', lineHeight: 1.5 }}>
                    {retryStatus}
                  </p>
                )}
              </div>
            </div>
          </main>
          <ChatWidget />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="app-layout">
          <SidebarNav onCreatePost={() => setShowCreatePost(true)} />
          <main style={{ flex: 1, maxWidth: '900px', minWidth: 0, paddingBottom: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '36px 24px',
              backgroundColor: 'var(--bg-surface, #121212)',
              border: '1px solid var(--border-color, #262626)',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              gap: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <WifiOff size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #ffffff)', marginBottom: '8px' }}>
                  Không thể tải trang cá nhân
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted, #a8a8a8)', lineHeight: 1.5 }}>
                  {error}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => fetchUserProfile(1)}
                  disabled={isRetrying}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--accent-blue, #0095f6)',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isRetrying ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isRetrying ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <RotateCw size={16} className={isRetrying ? 'spin-animation' : ''} />
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted, #a8a8a8)',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #262626)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          </main>
          <ChatWidget />
        </div>
      </div>
    );
  }

  if (!userProfile) return null;

  const { stats = {}, bio, posts = [] } = userProfile;
  const isOwnProfile = currentUser ? Number(currentUser.user_id) === Number(userProfile.user_id) : false;
  const effectiveOpenForCollab = (isOwnProfile && currentUser?.open_for_collab !== undefined)
    ? currentUser.open_for_collab
    : userProfile?.open_for_collab;

  const formattedProfilePosts = (posts || []).map(p => {
    let parsedProjectImages = [];
    let parsedToolsUsed = [];
    try {
      parsedProjectImages = Array.isArray(p.project_images) ? p.project_images : (typeof p.project_images === 'string' ? JSON.parse(p.project_images || '[]') : []);
    } catch { parsedProjectImages = []; }
    try {
      parsedToolsUsed = Array.isArray(p.tools_used) ? p.tools_used : (typeof p.tools_used === 'string' ? JSON.parse(p.tools_used || '[]') : []);
    } catch { parsedToolsUsed = []; }

    return {
      id: p.post_id || p.id,
      userId: userProfile.user_id,
      author: userProfile.username,
      authorAvatar: userProfile.profile_photo_url,
      isVerified: userProfile.is_verified,
      time: p.created_at || new Date().toISOString(),
      content: p.caption,
      imageUrl: p.photo_url || null,
      likes: parseInt(p.like_count, 10) || 0,
      isLiked: false,
      comments: p.comments || [],
      postType: (p.post_type === 'project' || p.post_type === 'portfolio' || Boolean(p.title && p.title.trim())) ? 'project' : 'social',
      title: p.title || '',
      projectImages: parsedProjectImages,
      toolsUsed: parsedToolsUsed,
      category: p.category || '',
      viewsCount: parseInt(p.views_count, 10) || 0
    };
  });

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main style={{ flex: 1, maxWidth: '1100px', minWidth: 0, paddingBottom: '80px' }}>
          {/* PROFILE HEADER CARD */}
          <section className="profile-header-card">
            {currentUser && (
              <button
                type="button"
                className="profile-menu-trigger-btn"
                onClick={() => setIsMenuModalOpen(true)}
                title="Tùy chọn trang cá nhân"
                aria-label="Tùy chọn trang cá nhân"
              >
                <Menu size={22} />
              </button>
            )}

            <div
              className={`profile-avatar-wrapper ${userActiveStories && userActiveStories.length > 0 ? 'has-active-story' : ''}`}
              onClick={handleAvatarClick}
              style={{ cursor: (userActiveStories && userActiveStories.length > 0) || isOwnProfile ? 'pointer' : 'default', position: 'relative' }}
              title={userActiveStories && userActiveStories.length > 0 ? 'Xem tin của người dùng' : (isOwnProfile ? 'Đăng bài hoặc tin mới' : '')}
            >
              <div className={userActiveStories && userActiveStories.length > 0 ? 'profile-avatar-story-ring' : ''}>
                <Avatar
                  user={userProfile}
                  size={130}
                  style={{
                    border: (userActiveStories && userActiveStories.length > 0) ? '3px solid var(--bg-surface)' : '3px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}
                />
              </div>
              {userActiveStories && userActiveStories.length > 0 && (
                <span className="profile-story-badge">TIN</span>
              )}
            </div>

            <div className="profile-details-column">
              <div className="profile-title-row">
                <h1 className="profile-username-heading" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {userProfile.username || username}
                  {userProfile.is_verified && (
                    <svg className="verified-badge-icon" viewBox="0 0 24 24" width="18" height="18" fill="#0095f6" aria-label="Tài khoản đã xác minh">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                  {userProfile.vip_tier && userProfile.vip_tier !== 'free' && (
                    <span
                      title={userProfile.vip_tier === 'pro' ? 'Hội viên VIP Pro' : 'Hội viên VIP Creator'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: userProfile.vip_tier === 'pro' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        border: `1px solid ${userProfile.vip_tier === 'pro' ? '#38bdf8' : '#eab308'}`,
                        color: userProfile.vip_tier === 'pro' ? '#38bdf8' : '#eab308',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}
                    >
                      <Crown size={12} color={userProfile.vip_tier === 'pro' ? '#38bdf8' : '#eab308'} />
                      <span>{userProfile.vip_tier === 'pro' ? 'VIP PRO' : 'VIP CREATOR'}</span>
                    </span>
                  )}
                </h1>

                {userProfile.is_private && (
                  <span className="private-badge-pill" title="Tài khoản riêng tư">
                    <Lock size={12} />
                    Riêng tư
                  </span>
                )}

                {userProfile.creator_type && CREATOR_LABELS[userProfile.creator_type] && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: '600'
                  }} title={`Nhà sáng tạo: ${CREATOR_LABELS[userProfile.creator_type].label}`}>
                    <span>{CREATOR_LABELS[userProfile.creator_type].emoji}</span>
                    <span>{CREATOR_LABELS[userProfile.creator_type].label}</span>
                  </span>
                )}

                {isOwnProfile ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button className="btn-profile-secondary" onClick={() => setIsEditModalOpen(true)}>
                      <Edit3 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Chỉnh sửa hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-vip-modal'))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: userProfile.vip_tier && userProfile.vip_tier !== 'free'
                          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15))'
                          : 'linear-gradient(135deg, #eab308, #f59e0b)',
                        color: userProfile.vip_tier && userProfile.vip_tier !== 'free' ? 'var(--text-primary)' : '#000',
                        border: userProfile.vip_tier && userProfile.vip_tier !== 'free' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(234, 179, 8, 0.25)'
                      }}
                      title="Nâng cấp hoặc quản lý gói VIP của bạn"
                    >
                      <Crown size={14} color={userProfile.vip_tier && userProfile.vip_tier !== 'free' ? '#eab308' : '#000'} />
                      <span>{userProfile.vip_tier && userProfile.vip_tier !== 'free' ? 'Gói VIP' : 'Nâng cấp VIP'}</span>
                    </button>
                    {userProfile.creator_type && (
                      effectiveOpenForCollab !== false ? (
                        <div className="profile-commission-badge" title="Sẵn sàng nhận dự án & báo giá">
                          <Briefcase size={13} />
                          <span>Đang nhận dự án</span>
                        </div>
                      ) : (
                        <div className="profile-commission-badge paused" style={{ background: 'rgba(100, 116, 139, 0.15)', borderColor: 'rgba(100, 116, 139, 0.3)', color: 'var(--text-muted)' }} title="Đang tạm ngưng nhận dự án (có thể bật lại trong Cài đặt & Tùy chọn)">
                          <Briefcase size={13} />
                          <span>Tạm ngưng nhận việc</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  currentUser && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {userProfile.creator_type && effectiveOpenForCollab !== false && (
                        <button
                          type="button"
                          className="btn-profile-cta-hire"
                          onClick={() => {
                            localStorage.setItem('activeChatUser', JSON.stringify({
                              user_id: userProfile.user_id || userProfile.id,
                              username: userProfile.username
                            }));
                            window.dispatchEvent(new Event('open-chat'));
                          }}
                        >
                          <Briefcase size={15} />
                          <span>Nhắn tin báo giá / Mời hợp tác</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleFollowToggle}
                        className="btn-profile-primary"
                      >
                        {followStatus?.is_following ? (
                          <>
                            <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Đang theo dõi
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Theo dõi
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-profile-secondary"
                        onClick={() => {
                          localStorage.setItem('activeChatUser', JSON.stringify({
                            user_id: userProfile.user_id || userProfile.id,
                            username: userProfile.username
                          }));
                          window.dispatchEvent(new Event('open-chat'));
                        }}
                      >
                        <MessageCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Nhắn tin
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Stats Counters */}
              <ul className="profile-metrics-list">
                <li className="metric-item">
                  <strong>{stats?.post_count ?? posts.length}</strong> bài viết
                </li>
                <li className="metric-item">
                  <strong>{stats?.follower_count ?? 0}</strong> người theo dõi
                </li>
                <li className="metric-item">
                  Đang theo dõi <strong>{stats?.following_count ?? 0}</strong>
                </li>
              </ul>

              {/* Thẻ nổi bật loại Nhà Sáng Tạo */}
              {userProfile.creator_type && CREATOR_LABELS[userProfile.creator_type] && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.28)',
                  marginBottom: '14px',
                  boxShadow: '0 2px 10px rgba(59, 130, 246, 0.08)'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    {CREATOR_LABELS[userProfile.creator_type].emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', fontSize: '14.5px', color: '#60a5fa' }}>
                        {CREATOR_LABELS[userProfile.creator_type].label}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: '#ffffff',
                        letterSpacing: '0.5px'
                      }}>
                        CREATOR
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                      {CREATOR_LABELS[userProfile.creator_type].desc}
                    </div>
                  </div>
                </div>
              )}

              {/* Bio block */}
              <div className="profile-bio-box" style={{ marginBottom: '12px' }}>
                {bio ? (
                  <p className="profile-bio-text" style={{ color: 'var(--text-primary)', fontSize: '14.5px', lineHeight: '1.6', margin: '4px 0 6px 0', fontWeight: '500', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                    {bio}
                  </p>
                ) : isOwnProfile ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '4px 0 6px 0', fontStyle: 'italic', cursor: 'pointer' }} onClick={() => setIsEditModalOpen(true)}>
                    + Thêm tiểu sử giới thiệu về bản thân...
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '4px 0 6px 0', fontStyle: 'italic' }}>
                    Chưa có tiểu sử cá nhân.
                  </p>
                )}

                {/* THÔNG TIN NƠI Ở, QUÊ QUÁN, ĐỘ TUỔI & SỞ THÍCH */}
                {(userProfile.address || userProfile.hometown || userProfile.age || userProfile.interests) ? (
                  <div className="profile-personal-info">
                    <div className="profile-info-grid">
                      {userProfile.address && (
                        <div className="profile-info-badge" title="Nơi ở hiện tại">
                          <MapPin size={13} />
                          <span>Sống tại <strong>{userProfile.address}</strong></span>
                        </div>
                      )}
                      {userProfile.hometown && (
                        <div className="profile-info-badge" title="Quê quán">
                          <Home size={13} />
                          <span>Đến từ <strong>{userProfile.hometown}</strong></span>
                        </div>
                      )}
                      {userProfile.age && (
                        <div className="profile-info-badge" title="Độ tuổi">
                          <Calendar size={13} />
                          <span><strong>{userProfile.age}</strong> tuổi</span>
                        </div>
                      )}
                    </div>

                    {userProfile.interests && (
                      <div className="profile-interests-container">
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                          <Sparkles size={12} color="#38bdf8" /> Sở thích:
                        </span>
                        {userProfile.interests.split(',').map((item, idx) => {
                          const tag = item.trim();
                          if (!tag) return null;
                          return (
                            <span key={idx} className="profile-interest-pill">
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  isOwnProfile && (
                    <button
                      type="button"
                      className="profile-add-info-btn"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Plus size={13} />
                      <span>Thêm quê quán, địa chỉ, sở thích để kết nối bạn bè ở gần</span>
                    </button>
                  )
                )}

                {/* THÔNG TIN LIÊN HỆ & BẢO MẬT (CHỈ HIỂN THỊ VỚI CHỦ TÀI KHOẢN) */}
                {isOwnProfile && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', fontSize: '13px' }}>
                      {/* Email */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} color="#38bdf8" />
                        <span style={{ color: 'var(--text-main, #ffffff)', fontWeight: '600' }}>
                          {userProfile.email || <span style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', fontWeight: '400' }}>Chưa thêm Email</span>}
                        </span>
                        {userProfile.email ? (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            background: userProfile.email_verified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: userProfile.email_verified ? '#22c55e' : '#eab308',
                            fontWeight: '700'
                          }}>
                            {userProfile.email_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </span>
                        ) : null}
                      </div>

                      {/* Phone */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#34d399" />
                        <span style={{ color: 'var(--text-main, #ffffff)', fontWeight: '600' }}>
                          {userProfile.phone || <span style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', fontWeight: '400' }}>Chưa thêm SĐT</span>}
                        </span>
                        {userProfile.phone ? (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            background: userProfile.phone_verified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: userProfile.phone_verified ? '#22c55e' : '#eab308',
                            fontWeight: '700'
                          }}>
                            {userProfile.phone_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Xác minh / Đổi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STORY HIGHLIGHTS (TIN NỔI BẬT KIỂU INSTAGRAM / TIKTOK) */}
          <section className="profile-highlights-section">
            <div className="profile-highlights-track no-scrollbar">
              {/* Nút tạo mới (chỉ dành cho chính chủ) */}
              {isOwnProfile && (
                <div
                  className="highlight-item"
                  onClick={() => setIsCreateHighlightOpen(true)}
                  role="button"
                  tabIndex={0}
                  title="Thêm tin nổi bật mới"
                >
                  <div className="highlight-circle-btn add-btn">
                    <Plus size={24} color="var(--text-main, #ffffff)" />
                  </div>
                  <span className="highlight-title">Mới</span>
                </div>
              )}

              {/* Danh sách các tin nổi bật */}
              {highlights && highlights.map(hl => (
                <div
                  key={hl.highlight_id}
                  className="highlight-item"
                  onClick={() => {
                    const stories = Array.isArray(hl.stories) && hl.stories.length > 0
                      ? hl.stories
                      : [{ media_url: hl.cover_url, media_type: 'image', caption: hl.title }];
                    setActiveStoryViewer(stories);
                    setActiveStoryIndex(0);
                  }}
                  role="button"
                  tabIndex={0}
                  title={hl.title}
                >
                  <div className="highlight-circle-btn">
                    <div className="highlight-cover-wrap">
                      <img
                        src={hl.cover_url || hl.stories?.[0]?.media_url || 'https://picsum.photos/100'}
                        alt={hl.title}
                        className="highlight-cover-img"
                      />
                    </div>
                  </div>
                  <span className="highlight-title">{hl.title}</span>
                  {isOwnProfile && (
                    <button
                      type="button"
                      className="highlight-delete-trigger"
                      onClick={(e) => handleDeleteHighlight(hl.highlight_id, e)}
                      title="Xóa tin nổi bật"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}

              {!isOwnProfile && highlights.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 6px' }}>
                  Chưa có tin nổi bật
                </div>
              )}
            </div>
          </section>

          {/* FRIENDS CARD */}
          <section style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '15px', fontWeight: '700' }}>
              <Users size={18} color="#60a5fa" />
              <span>Bạn bè ({friends.length})</span>
            </div>
            {friends.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {friends.map(friend => (
                  <button
                    key={friend.user_id}
                    type="button"
                    onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <Avatar user={friend} size={24} />
                    <span>{friend.username}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có bạn bè nào.</p>
            )}
          </section>

          {/* TABS SELECTOR (TÁC PHẨM & DÒNG THỜI GIAN) */}
          <div className="profile-tabs-nav">
            <button
              type="button"
              className={`profile-tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <LayoutGrid size={16} />
              <span>TÁC PHẨM</span>
            </button>

            <button
              type="button"
              className={`profile-tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <List size={16} />
              <span>DÒNG THỜI GIAN</span>
            </button>

            {isOwnProfile && (
              <Link
                to="/saved-posts"
                className="profile-tab-button"
                style={{ textDecoration: 'none' }}
              >
                <Bookmark size={16} />
                <span>ĐÃ LƯU</span>
              </Link>
            )}
          </div>

          {/* TAB 1: TÁC PHẨM (BEHANCE GRID FEED) */}
          {activeTab === 'portfolio' && (
            <div className="behance-grid-feed">
              {formattedProfilePosts.length > 0 ? (
                formattedProfilePosts.map(post => (
                  <ProjectCard
                    key={post.id}
                    post={post}
                    onOpenModal={(p) => setSelectedProject(p)}
                    onLike={() => {}}
                  />
                ))
              ) : (
                <div className="empty-feed-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-feed-icon-wrap">
                    <Layers size={32} color="#0095f6" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Chưa có tác phẩm nào
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
                    {isOwnProfile
                      ? 'Hãy chia sẻ dự án Portfolio đầu tiên để khách hàng và cộng đồng khám phá!'
                      : 'Nhà sáng tạo này chưa đăng dự án Portfolio nào.'}
                  </p>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setShowCreatePost(true)}
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
                      + Đăng Dự Án Mới
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DÒNG THỜI GIAN (TIMELINE STATUS POSTS) */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formattedProfilePosts.length > 0 ? (
                formattedProfilePosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    friendUserIds={new Set(friends.map(f => Number(f.user_id || f.id)))}
                    onLike={() => {}}
                    onCommentSubmit={() => {}}
                    onPostDeleted={() => fetchUserProfile()}
                    onPostUpdated={() => fetchUserProfile()}
                  />
                ))
              ) : (
                <div className="empty-feed-card">
                  <div className="empty-feed-icon-wrap">
                    <Clock size={30} color="#60a5fa" />
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Chưa có bài chia sẻ nào trên dòng thời gian.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* MODAL XEM CHI TIẾT DỰ ÁN BEHANCE */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onLike={() => {
              setSelectedProject(prev => prev ? {
                ...prev,
                isLiked: !prev.isLiked,
                likes: prev.isLiked ? Math.max(0, (prev.likes || 1) - 1) : (prev.likes || 0) + 1
              } : null);
            }}
            onCommentSubmit={(postId, text) => {
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

        <ChatWidget />
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <EditProfileModal
          user={{
            ...userProfile,
            open_for_collab: effectiveOpenForCollab,
            is_private: (isOwnProfile && currentUser?.is_private !== undefined) ? currentUser.is_private : userProfile?.is_private
          }}
          onClose={() => {
            setIsEditModalOpen(false);
            fetchUserProfile();
          }}
          navigate={navigate}
        />
      )}

      {/* REQUEST VERIFICATION MODAL */}
      <RequestVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitted={fetchUserProfile}
      />

      {/* CREATE POST MODAL */}
      {showCreatePost && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content modal-content-create-project" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo bài viết mới</h2>
              <button type="button" className="close-btn" onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </button>
            </div>
            <CreatePost
              onPostCreated={() => {
                fetchUserProfile();
                setShowCreatePost(false);
              }}
            />
          </div>
        </div>
      )}

      {/* PROFILE OPTIONS MENU MODAL */}
      <ProfileMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onRequestVerification={() => setIsVerificationModalOpen(true)}
      />

      {/* MODAL XEM STORY / TIN NỔI BẬT FULLSCREEN */}
      {/* MODAL XEM STORY / TIN NỔI BẬT FULLSCREEN */}
      {activeStoryViewer && activeStoryViewer.length > 0 && (() => {
        const activeStory = activeStoryViewer[activeStoryIndex] || {};
        let videoTrim = null;
        let mediaTransform = null;
        let parsedSticker = null;
        try {
          parsedSticker = JSON.parse(activeStory.sticker || '{}');
          videoTrim = parsedSticker.videoTrim || null;
          mediaTransform = parsedSticker.mediaTransform || null;
        } catch {}

        return (
          <div className="story-viewer-backdrop" onClick={() => setActiveStoryViewer(null)}>
            {/* Ambient Blur Background */}
            {activeStory.media_url && (
              <div
                className="story-ambient-blur"
                style={{ backgroundImage: `url(${mediaUrl(activeStory.media_url)})` }}
              />
            )}

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
              {activeStoryIndex < activeStoryViewer.length - 1 && (
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

              {/* Thanh tiến trình đa phân đoạn */}
              <div className="story-progress-container">
                {activeStoryViewer.map((_, idx) => (
                  <div key={idx} className="story-progress-bar">
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
                ))}
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
                onClick={() => setActiveStoryViewer(null)}
                aria-label="Đóng Story"
              >
                <X size={20} />
              </button>

              {/* Thông tin chủ story */}
              <div className="story-viewer-user">
                <Avatar user={{ username: userProfile?.username, profile_photo_url: userProfile?.profile_photo_url }} size={36} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff' }}>
                    {userProfile?.username}
                    {userProfile?.is_verified && (
                      <svg className="verified-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="#0095f6">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                  </strong>
                  {activeStory.created_at && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(activeStory.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Container hiển thị nội dung Story */}
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
                        alt="Bài viết được chia sẻ"
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                      />
                    )}
                    <div className="story-shared-post-content">
                      <strong>@{activeStory.shared_post.username}</strong>
                      <p>{activeStory.shared_post.caption || 'Bài viết hình ảnh'}</p>
                      <small>Nhấn để xem bài viết</small>
                    </div>
                  </button>
                ) : activeStory.media_type === 'video' ? (
                  <video
                    ref={profileViewerVideoRef}
                    src={mediaUrl(activeStory.media_url)}
                    autoPlay
                    playsInline
                    muted={videoTrim?.isMuted || false}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    disableRemotePlayback
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                    onEnded={handleNextStory}
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
                      setViewerCurrentTime(v.currentTime);
                      if (videoTrim?.endTime && videoTrim.endTime > 0 && v.currentTime >= videoTrim.endTime) {
                        handleNextStory();
                      }
                    }}
                    style={{
                      objectFit: mediaTransform?.fit || 'contain',
                      transform: `scale(${mediaTransform?.scale || 1}) translate(${mediaTransform?.offset?.x || 0}px, ${mediaTransform?.offset?.y || 0}px)`
                    }}
                  />
                ) : activeStory.media_url ? (
                  <img
                    src={mediaUrl(activeStory.media_url)}
                    alt={`Story của ${userProfile?.username}`}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); return false; }}
                    style={{
                      objectFit: mediaTransform?.fit || 'contain',
                      transform: `scale(${mediaTransform?.scale || 1}) translate(${mediaTransform?.offset?.x || 0}px, ${mediaTransform?.offset?.y || 0}px)`
                    }}
                  />
                ) : (
                  <div style={{ background: 'linear-gradient(135deg, #18181b, #09090b)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontSize: '20px', color: '#ffffff' }}>
                    {activeStory.caption || 'Khoảnh khắc nổi bật'}
                  </div>
                )}

                {/* Text & Sticker overlay */}
                {parsedSticker && (
                  <>
                    {parsedSticker.sticker && (
                      <div
                        className="story-sticker"
                        style={{
                          left: `${parsedSticker.stickerPos?.x ?? 50}%`,
                          top: `${parsedSticker.stickerPos?.y ?? 35}%`,
                          position: 'absolute',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 12
                        }}
                      >
                        <span>{parsedSticker.sticker}</span>
                      </div>
                    )}
                    {parsedSticker.text && (
                      <div
                        className="story-text-overlay"
                        style={{
                          left: `${parsedSticker.textPos?.x ?? 50}%`,
                          top: `${parsedSticker.textPos?.y ?? 55}%`,
                          position: 'absolute',
                          transform: 'translate(-50%, -50%)',
                          color: parsedSticker.textColor || '#ffffff',
                          background: parsedSticker.textBg ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
                          textAlign: parsedSticker.textAlign || 'center',
                          zIndex: 12,
                          padding: '6px 12px',
                          borderRadius: '8px'
                        }}
                      >
                        {parsedSticker.text}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL TẠO TIN NỔI BẬT MỚI */}
      {isCreateHighlightOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateHighlightOpen(false)}>
          <div className="modal-content highlight-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Tin nổi bật mới</h2>
              <button type="button" className="close-btn" onClick={() => setIsCreateHighlightOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateHighlight} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Tên tin nổi bật
                </label>
                <input
                  type="text"
                  className="modern-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                  value={newHighlightTitle}
                  onChange={e => setNewHighlightTitle(e.target.value)}
                  placeholder="Ví dụ: Kỷ niệm, Du lịch, Cuộc sống..."
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Chọn ảnh bìa từ bài viết của bạn
                </label>
                {userProfile?.posts && userProfile.posts.filter(p => p.photo_url).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                    {userProfile.posts.filter(p => p.photo_url).map(post => (
                      <div
                        key={post.post_id}
                        onClick={() => {
                          setSelectedHighlightPostId(post.post_id);
                          setNewHighlightCover(post.photo_url);
                        }}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: selectedHighlightPostId === post.post_id ? '3px solid #0095f6' : '1px solid var(--border-subtle)',
                          position: 'relative'
                        }}
                      >
                        <img src={post.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="url"
                    className="modern-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                    value={newHighlightCover}
                    onChange={e => setNewHighlightCover(e.target.value)}
                    placeholder="Dán đường dẫn ảnh bìa..."
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setIsCreateHighlightOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary"
                  disabled={!newHighlightTitle.trim()}
                >
                  Thêm tin nổi bật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;