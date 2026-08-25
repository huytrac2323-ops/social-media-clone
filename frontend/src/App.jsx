import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import ProfilePage from './ProfilePage';
import RegisterPage from './RegisterPage';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import PostPage from './PostPage';
import { AuthProvider, useAuth } from './AuthContext';
import.meta.env.VITE_API_URL

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';


function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion(v => v + 1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const userIdQuery = currentUser ? `?currentUserId=${currentUser.user_id}` : '';
        const response = await fetch(`${API_URL}/posts${userIdQuery}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const formattedPosts = data.map(post => ({
          id: post.post_id,
          userId: post.user_id, // Thêm userId để xác thực quyền
          author: post.username,
          time: post.created_at || post.time || new Date().toISOString(),          content: post.caption,
          imageUrl: post.photo_url || null,
          likes: post.like_count,
          isLiked: post.is_liked_by_user,
          comments: post.comments || [],
          authorAvatar: post.profile_photo_url
        }));
          const sortedPosts = formattedPosts.sort((a, b) => b.id - a.id);
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

    const [isLiking, setIsLiking] = useState(false);
    const handleLike = async (postId) => {
        if (isLiking) return; // Nếu đang xử lý thì bỏ qua lượt click tiếp theo
        setIsLiking(true);
        if (!currentUser) {
            alert("Vui lòng đăng nhập để thích bài viết!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // CẬP NHẬT LẠI STATE NGAY LẬP TỨC TRÊN GIAO DIỆN
            // Cập nhật state chuẩn xác cho 1 lần tăng/giảm
            setPosts(prevPosts => prevPosts.map(post => {
                if (post.id === postId) {
                    const isCurrentlyLiked = post.isLiked;
                    return {
                        ...post,
                        isLiked: !isCurrentlyLiked,
                        likes: isCurrentlyLiked ? Math.max(0, post.likes - 1) : post.likes + 1
                    };
                }
                return post;
            }));
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
        } finally {
            setIsLiking(false); // Mở khóa nút sau khi hoàn tất
        }
    };

  const handleCommentSubmit = async (postId, commentText) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để bình luận.');
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText, user_id: currentUser.user_id })
      });
      if (!response.ok) throw new Error('Lỗi khi bình luận');
      refreshData();
    } catch (error) { console.error("Lỗi khi bình luận:", error); }
  };

  const handleLogout = () => {
    logout();
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
        <Route path="/" element={
          <HomePage 
            posts={posts} 
            allUsers={allUsers} 
            onLike={handleLike} 
            onCommentSubmit={handleCommentSubmit}
            onPostCreated={refreshData}
            onPostDeleted={refreshData}
            onPostUpdated={refreshData}
          />} 
        />
        <Route path="/post/:postId" element={<PostPage onPostDeleted={refreshData} onPostUpdated={refreshData} />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/register" element={<RegisterPage onRegisterSuccess={refreshData} />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;