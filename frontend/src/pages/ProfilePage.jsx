import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link} from 'react-router-dom';
import '../styles/App.css';
import EditProfileModal from '../modals/EditProfileModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';


const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

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

  const getAvatarUrl = (url) => {
    if (!url) return 'https://picsum.photos/150';
    return url.startsWith('http') ? url : `https://social-media-clone-di9z.onrender.com${url}`;
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users/${username}`);
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
  }, [username]);

  const fetchConversations = async () => {
    if (!currentUser?.user_id) return;
    try {
      const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
      if (res.ok) setConversations(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUserProfile();
    if (currentUser?.user_id) {
      fetchConversations();
    }
  }, [fetchUserProfile, currentUser]);

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
                <h2 className="profile-username">{username}</h2>
                {isOwnProfile && (
                    <button className="btn-edit-profile" onClick={() => setIsEditModalOpen(true)}>
                      Chỉnh sửa trang cá nhân
                    </button>
                )}
              </div>

              {!isOwnProfile && currentUser && (
                  <button
                      onClick={async () => {
                        await fetch(`${API_URL}/friends/request`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ user_id: currentUser.user_id, friend_id: userProfile.user_id || userProfile.id })
                        });
                        alert("Đã gửi yêu cầu kết bạn!");
                      }}
                      style={{ background: '#2d88ff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
                  >
                    ➕ Thêm bạn bè
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
          <div className="home-left-sidebar">
            {/* 1. Nút Trang chủ */}
            <Link to="/" className="sidebar-box mobile-only-btn" style={{ textDecoration: 'none' }}>
              <h3>🏠<span>Trang chủ</span></h3>
            </Link>

            {currentUser ? (
                <>
                  {/* 2. Nút Trang cá nhân */}
                  <Link to={`/profile/${currentUser.username}`} className="sidebar-box mobile-only-btn" style={{ textDecoration: 'none' }}>
                    <h3>👤<span>{currentUser.username}</span></h3>
                  </Link>

                  {/* 3. Nút Đăng bài */}
                  <div className="sidebar-box mobile-only-btn" onClick={() => setShowCreatePost(true)}>
                    <h3>✍️<span>Đăng bài</span></h3>
                  </div>

                  {/* 4. Nút Đăng xuất (Thay thế nút Chat cũ) */}
                  <div
                      className="sidebar-box mobile-only-btn"
                      onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                      }}
                  >
                    <h3 style={{ color: '#ff4d4d' }}>🚪<span>Đăng xuất</span></h3>
                  </div>
                </>
            ) : (
                /* Nút Đăng nhập hiển thị khi chưa có user */
                <Link to="/login" className="sidebar-box mobile-only-btn" style={{ textDecoration: 'none' }}>
                  <h3>🔑<span>Đăng nhập</span></h3>
                </Link>
            )}
          </div>

          <ChatWidget />

        </div>
      </>
  );
}

export default ProfilePage;