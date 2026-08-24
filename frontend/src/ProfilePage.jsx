import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import EditProfileModal from './EditProfileModal';
import CreatePost from './CreatePost';
import { useAuth } from './AuthContext';
import FriendButton from './FriendButton.jsx';
const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const getAvatarUrl = (url) => {
    if (!url) return 'https://picsum.photos/150';
    return url.startsWith('http') ? url : `https://social-media-clone-di9z.onrender.com${url}`;
  };

  // Sử dụng useCallback để hàm fetchUserProfile không bị tạo lại mỗi lần render
  // trừ khi username (từ URL) thay đổi.
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

  // Effect này chỉ chạy khi component được mount lần đầu hoặc khi URL (username) thay đổi.
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // *** SỬA LỖI VÒNG LẶP VÔ HẠN ***
  // Effect này sẽ chạy khi `currentUser` từ context thay đổi (ví dụ: sau khi chỉnh sửa profile).
  // Nó sẽ KHÔNG gây ra vòng lặp vì không phụ thuộc vào `userProfile` state.
  useEffect(() => {
    // Chỉ fetch lại dữ liệu nếu `userProfile` đã được tải và đó là trang của người dùng hiện tại.
    if (userProfile && currentUser && userProfile.user_id === currentUser.user_id) {
        // So sánh để tránh fetch lại không cần thiết nếu không có gì thay đổi
        if(userProfile.username !== currentUser.username || userProfile.bio !== currentUser.bio || userProfile.profile_photo_url !== currentUser.profile_photo_url) {
            fetchUserProfile();
        }
    }
  }, [currentUser, userProfile, fetchUserProfile]);


  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Lỗi: {error}</div>;
  if (!userProfile) return null;

  const { stats = {}, bio, posts = [], profile_photo_url } = userProfile;
  const isOwnProfile = currentUser ? currentUser.user_id === userProfile.user_id : false;
  console.log("Link Avatar gốc lấy từ Backend:", userProfile?.profile_photo_url);
  return (
    <>
      {isEditModalOpen && (
        <EditProfileModal
          user={userProfile}
          onClose={() => setIsEditModalOpen(false)}
          navigate={navigate}
        />
      )}



      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large" style={{ backgroundImage: `url(${getAvatarUrl(profile_photo_url)})`, backgroundSize: 'cover' }}>              {!profile_photo_url && username[0].toUpperCase()}
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

        {isOwnProfile && (
          <main className="fb-feed" style={{ margin: '20px 0' }}>
             <CreatePost onPostCreated={fetchUserProfile} />
          </main>
        )}

        <div className="profile-tabs">
          <div className="profile-tab active">☰ BÀI VIẾT</div>
          <div className="profile-tab">💾 ĐÃ LƯU</div>
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
                <div className="grid-post-overlay">
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Chưa có bài viết nào.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default ProfilePage;