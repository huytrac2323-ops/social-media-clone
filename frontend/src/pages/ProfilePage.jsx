import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link} from 'react-router-dom';
import '../styles/App.css';
import EditProfileModal from '../modals/EditProfileModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import SidebarNav from '../components/SidebarNav.jsx';


const API_URL =import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State quản lý Popup Đăng bài & Khung chat cho di động
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [followStatus, setFollowStatus] = useState(null);

  const getAvatarUrl = (url) => {
    if (!url) return 'https://picsum.photos/150';
    return url.startsWith('http') ? url : `https://social-media-clone-di9z.onrender.com${url}`;
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Đính kèm viewer_id vào query params nếu đã đăng nhập
      const viewerParam = currentUser?.user_id ? `?viewer_id=${currentUser.user_id}` : '';
      const response = await fetch(`${API_URL}/users/${username}${viewerParam}`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Không tìm thấy người dùng.');
      }
      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, currentUser]);



  const fetchConversations = async () => {
    if (!currentUser?.user_id) return;
    try {
      const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
      if (res.ok) setConversations(await res.json());
    } catch (err) { console.error(err); }
  };

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
    if (currentUser?.user_id) {
      fetchConversations();
    }
  }, [fetchUserProfile, currentUser]);

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Lỗi: {error}</div>;
  if (!userProfile) return null;

  const { stats = {}, bio, posts = [], profile_photo_url } = userProfile;
  const isOwnProfile = currentUser ? currentUser.user_id === userProfile.user_id : false;

  return (
      <>
        {isEditModalOpen && (
            <EditProfileModal
                user={userProfile}
                onClose={() => setIsEditModalOpen(false)}
                navigate={navigate}
            />
        )}

        {/* POPUP ĐĂNG BÀI */}
        {showCreatePost && currentUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowCreatePost(false)}>
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', backgroundColor: '#242526', padding: '20px', borderRadius: '10px', }}>
                <CreatePost onPostCreated={() => { fetchUserProfile(); setShowCreatePost(false); }} />
                <button onClick={() => setShowCreatePost(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#3a3b3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy / Đóng</button>
              </div>
            </div>
        )}

        <div className="profile-container" style={{ paddingBottom: '70px' }}>
          <header className="profile-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large" style={{ backgroundImage: `url(${getAvatarUrl(profile_photo_url)})`, backgroundSize: 'cover' }}>
                {!profile_photo_url && username[0].toUpperCase()}
              </div>
            </div>
            <section className="profile-info-section">
              <div className="profile-info-header">
                <div className="username-container">
                  <h2 className="profile-username" style={{ margin: 0 }}>{username}</h2>
                  {userProfile.is_private && (
                      <span className="private-badge" title="Tài khoản riêng tư">
                            🔒 Riêng tư
                        </span>
                  )}
                </div>
                {isOwnProfile && (
                    <button className="btn-edit-profile" onClick={() => setIsEditModalOpen(true)}>
                      Chỉnh sửa trang cá nhân
                    </button>
                )}
              </div>

              {!isOwnProfile && currentUser && (
                  <button
                      onClick={handleFollowToggle}
                      style={{ background: '#2d88ff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
                  >
                    {followStatus?.is_following
                      ? 'Đang theo dõi'
                      : followStatus?.request_sent
                        ? 'Đã gửi yêu cầu'
                        : userProfile.is_private ? 'Yêu cầu theo dõi' : 'Theo dõi'}
                  </button>
              )}

              <ul className="profile-stats-list">
                <li><b>{stats?.post_count ?? 0}</b> bài viết</li>
                <li><b>{stats?.follower_count ?? 0}</b> người theo dõi</li>
                <li>Đang theo dõi <b>{stats?.following_count ?? 0}</b> người dùng</li>
              </ul>
              <div className="profile-bio">
                <b>{userProfile.username}</b>
                <p>{bio || "Chưa có tiểu sử."}</p>
              </div>
            </section>
          </header>

          <div className="profile-tabs">
            <div className="profile-tab active">☰ BÀI VIẾT</div>

            {isOwnProfile ? (
                <Link
                    to="/saved-posts"
                    className="profile-tab"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  💾 ĐÃ LƯU
                </Link>
            ) : (
                <div className="profile-tab" style={{ opacity: 0.5, cursor: 'not-allowed' }}>💾 ĐÃ LƯU</div>
            )}

            {!isOwnProfile && currentUser && (
                <button
                    className="btn-chat"
                    onClick={() => {
                      localStorage.setItem('activeChatUser', JSON.stringify({
                        user_id: userProfile.user_id || userProfile.id,
                        username: userProfile.username
                      }));
                      window.dispatchEvent(new Event('open-chat'));
                    }}
                    style={{ background: '#0084ff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
                >
                  💬 Nhắn tin
                </button>
            )}

            <div className="profile-tab">👤 ĐƯỢC GẮN THẺ</div>
          </div>

          <section style={{ margin: '16px 0', padding: '16px', background: '#242526', borderRadius: '8px', color: 'white' }}>
            <h3 style={{ margin: '0 0 12px' }}>Bạn bè ({friends.length})</h3>
            {friends.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {friends.map(friend => (
                  <button
                    key={friend.user_id}
                    type="button"
                    onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '1px solid #555', borderRadius: '20px', background: '#3a3b3c', color: 'white', cursor: 'pointer' }}
                  >
                    <img
                      src={getAvatarUrl(friend.profile_photo_url)}
                      alt={`Ảnh đại diện của ${friend.username}`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span>{friend.username}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#aaa' }}>Chưa có bạn bè.</p>
            )}
          </section>

          <div className="profile-posts-grid">
            {Array.isArray(posts) && posts.length > 0 ? (
                posts.map(post => (
                    <div
                        key={post.post_id}
                        className="grid-post-item"
                        onClick={() => handlePostClick(post.post_id)}
                        style={{ cursor: 'pointer' }}
                    >
                      {post.photo_url ? (
                          <img src={post.photo_url} alt={post.caption || 'Bài viết'} />
                      ) : (
                          <div className="grid-post-content">{post.caption}</div>
                      )}
                      <div className="grid-post-overlay"></div>
                    </div>
                ))
            ) : (
                <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Chưa có bài viết nào.</p>
            )}
          </div>


          {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG (Gồm Đăng nhập / Đăng xuất) */}
          <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

          <ChatWidget />

        </div>
      </>
  );
}

export default ProfilePage;