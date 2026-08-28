import React, { useEffect, useState } from 'react';
import PostCard from './PostCard';
import { useAuth } from '../context/AuthContext';

// Tự động nhận diện môi trường Localhost hay Online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';

function SavedPostsPage() {
    const { currentUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedPosts = async () => {
            if (!currentUser || !currentUser.user_id) return;
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/posts/saved/${currentUser.user_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setSavedPosts(data);
                }
            } catch (error) {
                console.error("Lỗi tải bài viết đã lưu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedPosts();
    }, [currentUser]);

    return (
        <div className="saved-posts-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>🔖 Bài viết đã lưu của bạn</h2>
            {loading ? (
                <p>Đang tải danh sách...</p>
            ) : savedPosts.length === 0 ? (
                <p style={{ color: '#b0b3b8' }}>Chưa có bài viết nào được lưu.</p>
            ) : (
                savedPosts.map(post => (
                    <PostCard
                        key={post.post_id || post.id}
                        post={{
                            ...post,
                            id: post.post_id || post.id,
                            comments: post.comments || []
                        }}
                        currentUser={currentUser}
                    />
                ))
            )}
        </div>
    );
}

export default SavedPostsPage;