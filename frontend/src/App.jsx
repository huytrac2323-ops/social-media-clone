import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import ProfilePage from './ProfilePage';
import RegisterPage from './RegisterPage';
import LoginPage from './LoginPage';

const API_URL = 'http://localhost:5000/api';

// --- COMPONENT CON: PostCard ---
const PostCard = ({ post, onLike, onCommentSubmit, currentUser }) => {
  const [commentText, setCommentText] = useState('');
  const handleCommentFormSubmit = (e) => { e.preventDefault(); if (!commentText.trim()) return; onCommentSubmit(post.id, commentText); setCommentText(''); };
  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author}`} className="post-author-link">
          <div className="avatar-placeholder">{post.author[0]}</div>
          <div className="post-meta"><h4 className="post-author">{post.author}</h4><span className="post-time">{new Date(post.time).toLocaleString()}</span></div>
        </Link>
      </div>
      {post.content && <p className="post-content">{post.content}</p>}
      {post.imageUrl && <img src={post.imageUrl} alt="Nội dung bài viết" className="post-image" />}
      <div className="post-stats"><span>♥️ {post.likes} lượt thích</span><span>{post.comments.length} bình luận</span></div>
      <hr />
      <div className="post-actions">
        <button className={`action-btn ${post.isLiked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>{post.isLiked ? '♥️ Đã thích' : '👍 Thích'}</button>
        <button className="action-btn">💬 Bình luận</button>
      </div>
      <hr />
      <div className="comments-section">
        {post.comments.map(comment => (
          <div key={comment.comment_id} className="comment-item">
            <Link to={`/profile/${comment.username}`} className="comment-author-link">
              <div className="avatar-placeholder mini-avatar">{comment.username[0]}</div>
              <span className="comment-author">{comment.username}: </span>
            </Link>
            <span className="comment-text">{comment.comment_text}</span>
          </div>
        ))}
        {currentUser && (
          <form onSubmit={handleCommentFormSubmit} className="comment-form">
            <input type="text" placeholder="Viết bình luận..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit" className="btn-send-comment">Đăng</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT CON: HomePage ---
const HomePage = ({ posts, onPostSubmit, onImageChange, inputText, setInputText, previewUrl, setPreviewUrl, setImageFile, fileInputRef, onLike, onCommentSubmit, allUsers, currentUser }) => {
  return (
    <div className="fb-body">
      <aside className="fb-sidebar">
        {currentUser ? (
          <Link to={`/profile/${currentUser.username}`} className="sidebar-item user-profile-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="avatar-placeholder mini-avatar">{currentUser.username[0]}</div>
            <b>{currentUser.username}</b>
          </Link>
        ) : (
          <div className="sidebar-item">Chào mừng Guest!</div>
        )}
        <div className="sidebar-item">👥 Bạn bè</div>
        <div className="sidebar-item">💾 Đã lưu</div>
      </aside>
      <main className="fb-feed">
        {currentUser && (
          <div className="create-post">
            <form onSubmit={onPostSubmit}><textarea placeholder={`Bạn đang nghĩ gì thế, ${currentUser.username}?`} value={inputText} onChange={(e) => setInputText(e.target.value)} />
              {previewUrl && (<div className="image-preview"><img src={previewUrl} alt="Xem trước" /><button type="button" className="remove-image-btn" onClick={() => { setPreviewUrl(null); setImageFile(null); }}>✕</button></div>)}
              <hr />
              <div className="create-post-actions"><input type="file" accept="image/*" onChange={onImageChange} ref={fileInputRef} style={{ display: 'none' }} /><button type="button" className="btn-add-photo" onClick={() => fileInputRef.current.click()}>📷 Thêm ảnh</button><button type="submit" className="btn-post">Đăng bài</button></div>
            </form>
          </div>
        )}
        {posts.map((post) => (<PostCard key={post.id} post={post} onLike={onLike} onCommentSubmit={onCommentSubmit} currentUser={currentUser} />))}
      </main>
      <aside className="fb-rightbar">
        <h3>Gợi ý cho bạn</h3>
        {allUsers.filter(u => !currentUser || u.user_id !== currentUser.user_id).map(user => (
          <Link key={user.user_id} to={`/profile/${user.username}`} className="contact-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="avatar-placeholder mini-avatar">{user.username[0]}</div>
            <span>{user.username}</span>
          </Link>
        ))}
      </aside>
    </div>
  );
};

// --- COMPONENT CHÍNH: App ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// --- COMPONENT WRAPPER ĐỂ CÓ THỂ SỬ DỤNG HOOK ---
function AppContent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [inputText, setInputText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const refreshData = () => setDataVersion(v => v + 1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const userIdQuery = currentUser ? `?currentUserId=${currentUser.user_id}` : '';
        const response = await fetch(`${API_URL}/posts${userIdQuery}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const formattedPosts = data.map(post => ({
          id: post.post_id, author: post.username, time: post.created_at, content: post.caption,
          imageUrl: post.photo_url ? `http://localhost:5000${post.photo_url}` : null,
          likes: post.like_count, isLiked: post.is_liked_by_user, comments: post.comments || []
        }));
        setPosts(formattedPosts);
      } catch (error) { console.error("Lỗi khi lấy dữ liệu bài viết:", error); }
    };
    const fetchAllUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Lỗi khi tải danh sách người dùng');
        const data = await response.json();
        setAllUsers(data);
      } catch (error) { console.error(error); }
    };
    fetchPosts();
    fetchAllUsers();
  }, [dataVersion, currentUser]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Vui lòng đăng nhập để đăng bài.');
    if (!inputText.trim() && !imageFile) return;
    const formData = new FormData();
    formData.append('caption', inputText);
    formData.append('user_id', currentUser.user_id);
    if (imageFile) formData.append('postImage', imageFile);
    try {
      const response = await fetch(`${API_URL}/posts`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Lỗi khi đăng bài');
      refreshData();
      setInputText(""); setImageFile(null); setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) { alert(`Đăng bài thất bại!\n\nLỗi: ${error.message}`); }
  };

  const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); } };

  const handleLike = async (postId) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để thích bài viết.');
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.user_id }) });
      setPosts(posts.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
    } catch (error) { console.error("Lỗi khi thích bài viết:", error); }
  };

  const handleCommentSubmit = async (postId, commentText) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để bình luận.');
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_text: commentText, user_id: currentUser.user_id }) });
      if (!response.ok) throw new Error('Lỗi khi bình luận');
      const newComment = await response.json();
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    } catch (error) { console.error("Lỗi khi bình luận:", error); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="fb-container">
      <nav className="fb-navbar">
        <div className="nav-left">
          <Link to="/" style={{ textDecoration: 'none' }}><h1 className="fb-logo">huybook</h1></Link>
          {currentUser && <input type="text" placeholder="Tìm kiếm..." className="search-bar" />}
        </div>
        <div className="nav-right">
          {currentUser ? (
            <>
              <Link to={`/profile/${currentUser.username}`} className="user-avatar-btn" style={{ textDecoration: 'none' }}>{currentUser.username}</Link>
              <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-logout">Đăng nhập</Link>
              <Link to="/register" className="user-avatar-btn" style={{ textDecoration: 'none' }}>Đăng ký</Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage posts={posts} allUsers={allUsers} onPostSubmit={handlePostSubmit} onImageChange={handleImageChange} inputText={inputText} setInputText={setInputText} previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} setImageFile={setImageFile} fileInputRef={fileInputRef} onLike={handleLike} onCommentSubmit={handleCommentSubmit} currentUser={currentUser} />} />
        <Route path="/profile/:username" element={<ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="/register" element={<RegisterPage onRegisterSuccess={refreshData} setCurrentUser={setCurrentUser} />} />
        <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
      </Routes>
    </div>
  );
}

export default App;