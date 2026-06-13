import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import EditProfileModal from './EditProfileModal';

// Bỏ hằng số API_URL
// const API_URL = 'http://localhost:5000';

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Sửa ở đây
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        throw new Error('Không tìm thấy người dùng hoặc có lỗi xảy ra.');
      }
      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Lỗi: {error}</div>;
  if (!userProfile) return null;

  const { stats, bio, posts, profile_photo_url } = userProfile;

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
            {/* Sửa ở đây */}
            <div className="profile-avatar-large" style={{ backgroundImage: `url(${profile_photo_url})`, backgroundSize: 'cover' }}>
              {!profile_photo_url && username[0].toUpperCase()}
            </div>
          </div>
          <section className="profile-info-section">
            <div className="profile-info-header">
              <h2 className="profile-username">{username}</h2>
              <button className="btn-edit-profile" onClick={() => setIsEditModalOpen(true)}>
                Chỉnh sửa trang cá nhân
              </button>
              <button className="btn-edit-profile" style={{ marginLeft: '10px' }}>
                Tạo bài viết
              </button>
            </div>
            <ul className="profile-stats-list">
              <li><b>{stats.post_count}</b> bài viết</li>
              <li><b>{stats.follower_count}</b> người theo dõi</li>
              <li>Đang theo dõi <b>{stats.following_count}</b> người dùng</li>
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
          {posts.map(post => (
            <div key={post.post_id} className="grid-post-item">
              {post.photo_url ? (
                // Sửa ở đây
                <img src={post.photo_url} alt={post.caption || 'Bài viết'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
