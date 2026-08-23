import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import Avatar from './Avatar'; // Import Avatar

function HomePage({ posts, allUsers, onLike, onCommentSubmit, onPostCreated }) {
  const { currentUser } = useAuth();

  return (
    <div className="fb-body">
      <aside className="fb-sidebar">
        {currentUser ? (
          <Link to={`/profile/${currentUser.username}`} className="sidebar-item user-profile-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar user={currentUser} className="mini-avatar" />
            <b>{currentUser.username}</b>
          </Link>
        ) : (
          <div className="sidebar-item">Chào mừng Guest!</div>
        )}
        <div className="sidebar-item">👥 Bạn bè</div>
        <div className="sidebar-item">💾 Đã lưu</div>
      </aside>
      <main className="fb-feed">
        <CreatePost onPostCreated={onPostCreated} />
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={onLike} 
            onCommentSubmit={onCommentSubmit} 
          />
        ))}
      </main>
      <aside className="fb-rightbar">
        <h3>Gợi ý cho bạn</h3>
          {allUsers
              .filter(u => !currentUser || u.user_id !== currentUser.user_id)
              // Thêm giới hạn hiển thị 5 gợi ý kết bạn để giao diện đẹp hơn
              .slice(0, 5)
              .map(user => (
          <Link key={user.user_id} to={`/profile/${user.username}`} className="contact-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar user={user} className="mini-avatar" />
            <span>{user.username}</span>
          </Link>
        ))}
      </aside>
    </div>
  );
}

export default HomePage;