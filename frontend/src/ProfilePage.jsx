import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import EditProfileModal from './EditProfileModal';

const API_URL = 'http://localhost:5000/api';

function ProfilePage({ currentUser, setCurrentUser }) { // Nhận setCurrentUser
  const { username } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      setUserProfile(null);
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
    };
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

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
          setCurrentUser={setCurrentUser} // Truyền setCurrentUser
        />
      )}

      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large" style={{ backgroundImage: `url(${profile_photo_url ? `http://localhost:5000${profile_photo_url}` : 'https://picsum.photos/150'})`, backgroundSize: 'cover' }}>
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
          <div className="profile-tab">💾 ĐÃ LƯU</div>
          <div className="profile-tab">👤 ĐƯỢC GẮN THẺ</div>
        </div>

        <div className="profile-posts-grid">
          {Array.isArray(posts) && posts.map(post => (
            <div key={post.post_id} className="grid-post-item">
              {post.photo_url ? (
                <img src={`http://localhost:5000${post.photo_url}`} alt={post.caption || 'Bài viết'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="grid-post-content">{post.caption}</div>
              )}
              <div className="grid-post-overlay">
                <span>👍 0</span>
                <span>💬 0</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProfilePage;