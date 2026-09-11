import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ChatBox from '../components/ChatBox.jsx';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { LocalNotifications } from '@capacitor/local-notifications';
import { io } from 'socket.io-client';


CapacitorUpdater.notifyAppReady();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://social-media-clone-di9z.onrender.com';
const socket = io(SOCKET_URL, {
    secure: true,
    transports: ['websocket', 'polling']
});

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const FALLBACK_API_URL = 'https://social-media-clone-di9z.onrender.com/api';

const safeFetch = async (path, options) => {
    try {
        const res = await fetch(`${API_URL}${path}`, options);
        if (res.ok) return res;
        if (res.status !== 502 && res.status !== 503) return res;
    } catch (e) {
        console.warn(`Lỗi kết nối tới ${API_URL}${path}, chuyển sang API dự phòng...`);
    }
    if (API_URL !== FALLBACK_API_URL) {
        try {
            return await fetch(`${FALLBACK_API_URL}${path}`, options);
        } catch (err) {
            console.error('Lỗi kết nối tới API dự phòng:', err);
        }
    }
    return await fetch(`${API_URL}${path}`, options);
};

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
    const {currentUser} = useAuth();
    const [posts, setPosts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [dataVersion, setDataVersion] = useState(0);
    const [activeChat, setActiveChat] = useState(null);

    const friendUserIds = new Set(
        friends.map(f => Number(f.user_id || f.id))
    );

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
            const isForMe = String(newMessage.receiver_id) === String(currentUser?.user_id);

            // Kiểm tra xem mình có đang mở khung chat với người đó không
            // Nếu đang mở chat rồi thì không cần ting ting nữa
            const isChattingWithThem = String(activeChat?.user_id) === String(newMessage.sender_id);

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
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Bạn có tin nhắn mới', {
                        body: newMessage.message_text,
                        tag: `message-${newMessage.message_id || newMessage.id}`
                    });
                }
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
        const fetchFriends = async () => {
            if (!currentUser?.user_id) {
                setFriends([]);
                return;
            }
            try {
                const response = await safeFetch(`/friends/${currentUser.user_id}/list`);
                if (response.ok) {
                    const data = await response.json();
                    setFriends(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Lỗi khi tải danh sách bạn bè:", error);
            }
        };

        const fetchPosts = async () => {
            try {
                const userIdQuery = currentUser ? `?currentUserId=${currentUser.user_id}` : '';
                const response = await safeFetch(`/posts${userIdQuery}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                const currentFriendSet = new Set(
                    (Array.isArray(friends) ? friends : []).map(f => Number(f.user_id || f.id))
                );
                const formattedPosts = data.map(post => ({
                    id: post.post_id,
                    userId: post.user_id,
                    author: post.username,
                    isVerified: Boolean(post.is_verified),
                    time: post.created_at || post.time || new Date().toISOString(),
                    content: post.caption,
                    imageUrl: post.photo_url || null,
                    likes: parseInt(post.like_count, 10) || 0,
                    isLiked: Boolean(post.is_liked_by_user),
                    isFriend: Boolean(post.is_friend || currentFriendSet.has(Number(post.user_id))),
                    friendRequestSent: Boolean(post.friend_request_sent),
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
                const response = await safeFetch('/users');
                if (!response.ok) throw new Error('Lỗi khi tải danh sách người dùng');
                const data = await response.json();
                setAllUsers(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchFriends();
        fetchPosts();
        fetchAllUsers();
    }, [dataVersion, currentUser]);

    const handleLike = async (postId) => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để thích bài viết!");
            return;
        }

        // Cập nhật lạc quan (Optimistic update) đảm bảo tính toán số học chuẩn xác
        setPosts(prevPosts => prevPosts.map(post => {
            if (Number(post.id) === Number(postId) || Number(post.post_id) === Number(postId)) {
                const isCurrentlyLiked = Boolean(post.isLiked);
                const currentLikes = parseInt(post.likes, 10) || 0;
                const nextLiked = !isCurrentlyLiked;
                return {
                    ...post,
                    isLiked: nextLiked,
                    likes: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                };
            }
            return post;
        }));

        try {
            const response = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ user_id: currentUser.user_id })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // Đồng bộ lại chính xác số lượng tym từ cơ sở dữ liệu
            if (data.likeCount !== undefined) {
                setPosts(prevPosts => prevPosts.map(post => {
                    if (Number(post.id) === Number(postId) || Number(post.post_id) === Number(postId)) {
                        return {
                            ...post,
                            isLiked: Boolean(data.isLiked),
                            likes: parseInt(data.likeCount, 10)
                        };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error("Lỗi khi thích bài viết:", error);
            // Khôi phục lại trạng thái nếu có lỗi
            fetchPosts();
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

    const closeChat = () => {
        setActiveChat(null);
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
                        friends={friends}
                        friendUserIds={friendUserIds}
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
                <Route path="/profile" element={<ProfilePage/>}/>
                <Route path="/register" element={<RegisterPage onRegisterSuccess={refreshData}/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/saved-posts" element={<SavedPostsPage/>}/>
                <Route path="/explore" element={<ExplorePage/>}/>
                <Route path="/messages" element={<MessagesPage/>}/>
                <Route path="/messages/:userId" element={<MessagesPage/>}/>
                <Route path="/notifications" element={<NotificationsPage/>}/>
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