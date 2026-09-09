import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import '../styles/App.css';
import ProfilePage from '../pages/ProfilePage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PostPage from '../pages/PostPage.jsx';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import SavedPostsPage from '../components/SavedPostsPage.jsx';
import ExplorePage from '../pages/ExplorePage.jsx';
import MessagesPage from '../pages/MessagesPage.jsx';
import ChatBox from '../components/ChatBox.jsx';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { LocalNotifications } from '@capacitor/local-notifications';
import { io } from 'socket.io-client';


CapacitorUpdater.notifyAppReady();

const SOCKET_URL = 'https://social-media-clone-di9z.onrender.com';
const socket = io(SOCKET_URL, {
    secure: true,
    transports: ['websocket', 'polling']
});

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

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
    const {currentUser, logout} = useAuth();
    const [posts, setPosts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [dataVersion, setDataVersion] = useState(0);
    const [activeChat, setActiveChat] = useState(null);
    const [activeChatUser, setActiveChatUser] = useState(null);

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


    useEffect(() => {
        // 1. Yêu cầu người dùng cấp quyền hiển thị thông báo khi vừa mở app
        const requestPermissions = async () => {
            await LocalNotifications.requestPermissions();
        };
        requestPermissions();

        // 2. Lắng nghe tin nhắn mới từ máy chủ
        const handleNewMessage = async (newMessage) => {
            // Kiểm tra xem tin nhắn có phải gửi cho mình không
            const isForMe = newMessage.receiver_id === currentUser?.user_id;

            // Kiểm tra xem mình có đang mở khung chat với người đó không
            // Nếu đang mở chat rồi thì không cần ting ting nữa
            const isChattingWithThem = activeChat?.user_id === newMessage.sender_id;

            if (isForMe && !isChattingWithThem) {
                // Hiển thị thông báo nổi trên điện thoại
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "Bạn có tin nhắn mới",
                            body: newMessage.message_text,
                            id: Math.floor(Math.random() * 100000), // ID ngẫu nhiên để không bị đè thông báo
                        }
                    ]
                });
            }
        };

        // Đăng ký sự kiện lắng nghe
        socket.on('receive_message', handleNewMessage);

        return () => {
            // Hủy lắng nghe khi thoát app để tránh trùng lặp
            socket.off('receive_message', handleNewMessage);
        };
    }, [currentUser, activeChat]);

    useEffect(() => {
        if (!currentUser?.user_id) return undefined;
        let cancelled = false;
        const notifyActivity = async () => {
            try {
                const response = await fetch(`${API_URL}/notifications/${currentUser.user_id}`);
                if (!response.ok || cancelled) return;
                const notifications = await response.json();
                const seen = new Set(JSON.parse(localStorage.getItem('deviceNotificationIds') || '[]'));
                const fresh = notifications.filter(item => !item.is_read && !seen.has(item.notification_id));
                if (fresh.length) {
                    await LocalNotifications.schedule({
                        notifications: fresh.slice(0, 5).map(item => ({
                            id: Number(item.notification_id),
                            title: 'Hoạt động mới',
                            body: item.content || `${item.username} vừa tương tác với bạn`,
                            extra: { notificationId: item.notification_id }
                        }))
                    });
                    const updated = [...seen, ...fresh.map(item => item.notification_id)].slice(-200);
                    localStorage.setItem('deviceNotificationIds', JSON.stringify(updated));
                }
            } catch (error) {
                console.error('Không thể đồng bộ thông báo thiết bị:', error);
            }
        };
        notifyActivity();
        const interval = setInterval(notifyActivity, 10000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [currentUser]);

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
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu bài viết:", error);
            }
        };

        const fetchAllUsers = async () => {
            try {
                const response = await fetch(`${API_URL}/users`);
                if (!response.ok) throw new Error('Lỗi khi tải danh sách người dùng');
                const data = await response.json();
                setAllUsers(data);
            } catch (error) {
                console.error(error);
            }
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Thêm token vào đây nếu backend yêu cầu xác thực
                },
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({comment_text: commentText, user_id: currentUser.user_id})
            });
            if (!response.ok) throw new Error('Lỗi khi bình luận');
            refreshData();
        } catch (error) {
            console.error("Lỗi khi bình luận:", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const closeChat = () => {
        setActiveChat(null);
        setActiveChatUser(null);
        localStorage.removeItem('activeChatUser');
        window.location.reload(); // Tải lại nhẹ để làm mới trạng thái hiển thị góc phải
    };
    return (
        <div className="app-root-wrapper">
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
                <Route path="/post/:postId"
                       element={<PostPage onPostDeleted={refreshData} onPostUpdated={refreshData}/>}/>
                <Route path="/profile/:username" element={<ProfilePage/>}/>
                <Route path="/register" element={<RegisterPage onRegisterSuccess={refreshData}/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/saved-posts" element={<SavedPostsPage/>}/>
                <Route path="/explore" element={<ExplorePage/>}/>
                <Route path="/messages" element={<MessagesPage/>}/>
                <Route path="/messages/:userId" element={<MessagesPage/>}/>
            </Routes>

            {currentUser && activeChat && (
                <div style={{
                    position: 'fixed',
                    bottom: '78px',
                    right: '24px',
                    zIndex: 9999999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    maxHeight: 'calc(100vh - 150px)',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%',
                    gap: '6px'
                }}>
                    <button
                        type="button"
                        onClick={closeChat}
                        style={{
                            background: 'rgba(30, 38, 52, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '5px 12px',
                            borderRadius: '999px',
                            fontWeight: '600',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        ✕ Đóng chat ({activeChat.username})
                    </button>
                    <ChatBox currentUser={currentUser} friendId={activeChat.user_id} friendName={activeChat.username}/>
                </div>
            )}
        </div>
    );
}
export default App;