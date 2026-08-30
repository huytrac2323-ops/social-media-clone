import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';



function SavedPostsPage() {
    const { currentUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);



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