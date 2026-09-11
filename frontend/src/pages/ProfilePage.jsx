import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/App.css';
import EditProfileModal from '../modals/EditProfileModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import SidebarNav from '../components/SidebarNav.jsx';
import Avatar from '../components/Avatar.jsx';
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
} from 'lucide-react';
import ProfileMenuModal from '../components/ProfileMenuModal.jsx';
import { safeFetch, getApiBaseUrl } from '../utils/api';

const API_URL = getApiBaseUrl();

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
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

  const handleAvatarClick = () => {
    if (userActiveStories && userActiveStories.length > 0) {
      setActiveStoryViewer(userActiveStories);
      setActiveStoryIndex(0);
    } else if (currentUser && Number(currentUser.user_id) === Number(userProfile?.user_id)) {
      setShowCreatePost(true);
    }
  };

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

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main style={{ flex: 1, maxWidth: '900px', minWidth: 0, paddingBottom: '80px' }}>
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
                </h1>

                {userProfile.is_private && (
                  <span className="private-badge-pill" title="Tài khoản riêng tư">
                    <Lock size={12} />
                    Riêng tư
                  </span>
                )}

                {isOwnProfile ? (
                  <button className="btn-profile-secondary" onClick={() => setIsEditModalOpen(true)}>
                    <Edit3 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Chỉnh sửa hồ sơ
                  </button>
                ) : (
                  currentUser && (
                    <div style={{ display: 'flex', gap: '8px' }}>
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

              {/* Bio block */}
              <div className="profile-bio-box">
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {userProfile.username}
                </div>
                <p style={{ color: '#cbd5e1', margin: 0 }}>
                  {bio || "Chưa có tiểu sử cá nhân."}
                </p>

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

          {/* TABS SELECTOR */}
          <div className="profile-tabs-nav">
            <button
              type="button"
              className={`profile-tab-button ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <Grid size={16} />
              <span>BÀI VIẾT</span>
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

            <button
              type="button"
              className={`profile-tab-button ${activeTab === 'tagged' ? 'active' : ''}`}
              onClick={() => setActiveTab('tagged')}
            >
              <Tag size={16} />
              <span>ĐƯỢC GẮN THẺ</span>
            </button>
          </div>

          {/* POSTS GRID */}
          <div className="profile-grid-container">
            {Array.isArray(posts) && posts.length > 0 ? (
              posts.map(post => (
                <div
                  key={post.post_id}
                  className="profile-grid-item"
                  onClick={() => handlePostClick(post.post_id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') handlePostClick(post.post_id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {post.photo_url ? (
                    <img src={post.photo_url} alt={post.caption || 'Bài viết'} loading="lazy" />
                  ) : (
                    <div style={{
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      fontSize: '13.5px',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-input)'
                    }}>
                      {post.caption}
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="profile-grid-item-overlay">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Heart size={18} fill="white" />
                      {post.like_count ?? 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageCircle size={18} fill="white" />
                      {post.comment_count ?? (post.comments ? post.comments.length : 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <p style={{ fontSize: '15px' }}>Chưa có bài viết nào.</p>
              </div>
            )}
          </div>
        </main>

        <ChatWidget />
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <EditProfileModal
          user={userProfile}
          onClose={() => setIsEditModalOpen(false)}
          navigate={navigate}
        />
      )}

      {/* CREATE POST MODAL */}
      {showCreatePost && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
      />

      {/* MODAL XEM STORY / TIN NỔI BẬT FULLSCREEN */}
      {activeStoryViewer && activeStoryViewer.length > 0 && (
        <div className="story-viewer-backdrop" onClick={() => setActiveStoryViewer(null)}>
          {activeStoryViewer[activeStoryIndex]?.media_url && (
            <div
              className="story-ambient-blur"
              style={{ backgroundImage: `url(${activeStoryViewer[activeStoryIndex].media_url})` }}
            />
          )}
          <div className="story-viewer" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="story-close-button"
              onClick={() => setActiveStoryViewer(null)}
              aria-label="Đóng Story"
            >
              <X size={20} />
            </button>

            {/* Thanh tiến trình */}
            <div className="story-progress-container">
              {activeStoryViewer.map((_, idx) => (
                <div key={idx} className="story-progress-bar">
                  <div
                    className={`story-progress-fill ${idx < activeStoryIndex ? 'completed' : idx === activeStoryIndex ? 'active' : ''}`}
                  />
                </div>
              ))}
            </div>

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
                {activeStoryViewer[activeStoryIndex]?.created_at && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    {new Date(activeStoryViewer[activeStoryIndex].created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* Nội dung Story */}
            <div className="story-viewer-body" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {activeStoryViewer[activeStoryIndex]?.media_type === 'video' ? (
                <video
                  src={activeStoryViewer[activeStoryIndex].media_url}
                  autoPlay
                  controls
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : activeStoryViewer[activeStoryIndex]?.media_url ? (
                <img
                  src={activeStoryViewer[activeStoryIndex].media_url}
                  alt="Story"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ background: 'linear-gradient(135deg, #18181b, #09090b)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontSize: '20px', color: '#ffffff' }}>
                  {activeStoryViewer[activeStoryIndex]?.caption || activeStoryViewer[activeStoryIndex]?.sticker || 'Khoảnh khắc nổi bật'}
                </div>
              )}
            </div>

            {/* Khu vực chạm trái / phải để chuyển Story */}
            <div
              style={{ position: 'absolute', top: '60px', left: 0, width: '40%', height: 'calc(100% - 60px)', zIndex: 10, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
              }}
            />
            <div
              style={{ position: 'absolute', top: '60px', right: 0, width: '40%', height: 'calc(100% - 60px)', zIndex: 10, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeStoryIndex < activeStoryViewer.length - 1) {
                  setActiveStoryIndex(activeStoryIndex + 1);
                } else {
                  setActiveStoryViewer(null);
                }
              }}
            />
          </div>
        </div>
      )}

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