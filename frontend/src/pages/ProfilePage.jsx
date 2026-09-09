import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import ProfileMenuModal from '../components/ProfileMenuModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

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

  // Điều hướng an toàn nếu username không hợp lệ hoặc 'undefined'
  useEffect(() => {
    if (!username || username === 'undefined') {
      const fallbackUsername = currentUser?.username || currentUser?.user?.username;
      if (fallbackUsername) {
        navigate(`/profile/${encodeURIComponent(fallbackUsername)}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [username, currentUser, navigate]);

  const fetchUserProfile = useCallback(async (attempt = 1) => {
    if (!username || username === 'undefined') return;

    if (attempt === 1) {
      setLoading(true);
      setError(null);
      setRetryStatus('');
    } else {
      setIsRetrying(true);
      setRetryStatus(`Máy chủ Render đang thức giấc... Đang tự động kết nối lại (lần ${attempt}/2)`);
    }

    try {
      const viewerParam = currentUser?.user_id ? `?viewer_id=${currentUser.user_id}` : '';
      const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}${viewerParam}`);

      if (!response.ok) {
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

      // Tự động thử lại 1 lần nếu gặp lỗi mạng (Render cold-start)
      if (isNetworkError && attempt < 2) {
        setRetryStatus('Máy chủ đang khởi động lại (Render sleep mode), đang tự động kết nối lại sau 2.5s...');
        setTimeout(() => {
          fetchUserProfile(attempt + 1);
        }, 2500);
        return;
      }

      if (isNetworkError) {
        setError('Không thể kết nối đến máy chủ. Máy chủ Render có thể đang khởi động lại sau thời gian không hoạt động (mất 30-50 giây). Vui lòng bấm "Thử lại".');
      } else {
        setError(err.message || 'Không tìm thấy người dùng.');
      }
      setLoading(false);
      setIsRetrying(false);
      setRetryStatus('');
    }
  }, [username, currentUser]);

  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/friends/${userId}/list`);
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
      const response = await fetch(`${API_URL}/friends/follow-status/${currentUser.user_id}/${followeeId}`);
      if (!response.ok) throw new Error('Không thể tải trạng thái theo dõi.');
      setFollowStatus(await response.json());
    } catch (err) {
      console.error('Lỗi khi lấy trạng thái theo dõi:', err);
      setFollowStatus(null);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchFriends(userProfile.user_id);
      fetchFollowStatus(userProfile.user_id);
    }
  }, [fetchFriends, fetchFollowStatus, userProfile?.user_id]);

  const handleFollowToggle = async () => {
    if (!currentUser?.user_id || !userProfile?.user_id) return;
    const endpoint = followStatus?.is_following || followStatus?.request_sent
      ? `${API_URL}/friends/follow/${currentUser.user_id}/${userProfile.user_id}`
      : `${API_URL}/friends/follow`;
    const response = await fetch(endpoint, {
      method: followStatus?.is_following || followStatus?.request_sent ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: followStatus?.is_following || followStatus?.request_sent
        ? undefined
        : JSON.stringify({ follower_id: currentUser.user_id, followee_id: userProfile.user_id })
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Không thể cập nhật theo dõi.');
      return;
    }
    await fetchFollowStatus(userProfile.user_id);
    await fetchUserProfile();
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

            <div className="profile-avatar-wrapper">
              <Avatar user={userProfile} size={130} style={{ border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} />
            </div>

            <div className="profile-details-column">
              <div className="profile-title-row">
                <h1 className="profile-username-heading">{username}</h1>

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
                        ) : followStatus?.request_sent ? (
                          'Đã gửi yêu cầu'
                        ) : (
                          <>
                            <UserPlus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            {userProfile.is_private ? 'Yêu cầu theo dõi' : 'Theo dõi'}
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
              </div>
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
    </div>
  );
}

export default ProfilePage;