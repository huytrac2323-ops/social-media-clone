import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PostCard from './PostCard.jsx';

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function SavedPostsPage() {
    const { currentUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedPosts = async () => {
            if (!currentUser?.user_id) return;
            try {
                const res = await fetch(`${API_URL}/saved-posts/${currentUser.user_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) throw new Error('Không thể tải danh sách bài viết đã lưu');
                const data = await res.json();
                setSavedPosts(data);
            } catch (err) {
                console.error(err);
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
                            userId: post.user_id || post.userId,
                            author: post.author,
                            authorAvatar: post.authorAvatar,
                            time: post.created_at,
                            content: post.content,
                            imageUrl: post.photo_url,
                            likes: post.likes,
                            shares: post.sharesCount,
                            comments: post.comments || [],
                            isSaved: true
                        }}
                    />
                ))
            )}
        </div>
    );
}

export default SavedPostsPage;