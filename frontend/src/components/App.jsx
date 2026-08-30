import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import '../styles/App.css';
import ProfilePage from '../pages/ProfilePage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PostPage from '../pages/PostPage.jsx';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import SavedPostsPage from '../components/SavedPostsPage.jsx';
import ChatBox from '../components/ChatBox.jsx';
import NotificationDropdown from "../components/NotificationDropdown.jsx";
import { CapacitorUpdater } from '@capgo/capacitor-updater';

CapacitorUpdater.notifyAppReady();


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
    const [activeChat, setActiveChat] = useState(null);

    useEffect(() => {
        const handleOpenChat = () => {
            const chatData = localStorage.getItem('activeChatUser');
            if (chatData) {
                setActiveChat(JSON.parse(chatData));
            }
        };


        // Lắng nghe sự kiện open-chat từ ProfilePage hoặc HomePage
        window.addEventListener('open-chat', handleOpenChat);

        // Dọn dẹp sự kiện khi component unmount
        return () => window.removeEventListener('open-chat', handleOpenChat);
    }, []);

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
                    userId: post.user_id,
                    author: post.username,
                    time: post.created_at || post.time || new Date().toISOString(),
                    content: post.caption,
                    imageUrl: post.photo_url || null,
                    likes: post.like_count,
                    isLiked: post.is_liked_by_user,
                    comments: post.comments || [],
                    authorAvatar: post.profile_photo_url
                }));
                const sortedPosts = formattedPosts.sort((a, b) => b.id - a.id);
                setPosts(sortedPosts);
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
        if (isLiking) return;
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
            setIsLiking(false);
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

                    <Link to="/" style={{ textDecoration: 'none' }}><h1 className="fb-logo">Dissipation</h1></Link>
                    {currentUser && <input type="text" placeholder="Tìm kiếm..." className="search-bar" />}
                </div>
                <div className="nav-right">
                    <NotificationDropdown />
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
                <Route path="/saved-posts" element={<SavedPostsPage />} />
            </Routes>

            {currentUser && activeChat && (
                <div className="chat-box-wrapper">
                    <div
                        style={{ background: '#3a3b3c', padding: '10px', textAlign: 'right', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}
                        onClick={() => setActiveChat(null)}
                    >
                        ✕ Đóng đoạn chat
                    </div>
                    <ChatBox currentUser={currentUser} friendId={activeChat.user_id} friendName={activeChat.username} />
                </div>
            )}
        </div>
    );
}

export default App;