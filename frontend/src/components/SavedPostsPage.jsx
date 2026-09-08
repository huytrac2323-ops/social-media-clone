import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PostCard from './PostCard.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function SavedPostsPage() {
    const { currentUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [newCollection, setNewCollection] = useState('');
    const loadSavedPosts = async (collectionId = null) => {
        const endpoint = collectionId
            ? `${API_URL}/saved-collections/${collectionId}/posts/${currentUser.user_id}`
            : `${API_URL}/saved-posts/${currentUser.user_id}`;
        const res = await fetch(endpoint);
        if (res.ok) setSavedPosts(await res.json());
    };

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
        fetch(`${API_URL}/saved-collections/${currentUser?.user_id}`)
            .then(res => res.ok ? res.json() : [])
            .then(setCollections)
            .catch(console.error);
    }, [currentUser]);

    const createCollection = async (event) => {
        event.preventDefault();
        if (!newCollection.trim()) return;
        const res = await fetch(`${API_URL}/saved-collections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ user_id: currentUser.user_id, name: newCollection })
        });
        if (!res.ok) return;
        const collection = await res.json();
        setCollections(previous => [collection, ...previous]);
        setNewCollection('');
    };

    return (
        <div className="saved-posts-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>🔖 Bài viết đã lưu của bạn</h2>
            <form onSubmit={createCollection} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={newCollection} onChange={e => setNewCollection(e.target.value)}
                       placeholder="Tên bộ sưu tập mới" />
                <button type="submit">Tạo</button>
            </form>
            {collections.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    <button onClick={() => { setSelectedCollection(null); loadSavedPosts(); }}>Tất cả</button>
                    {collections.map(collection => (
                        <button key={collection.collection_id}
                                onClick={async () => {
                                    setSelectedCollection(collection.collection_id);
                                    await loadSavedPosts(collection.collection_id);
                                }}>
                            {collection.name} ({collection.post_count})
                        </button>
                    ))}
                </div>
            )}
            {loading ? (
                <p>Đang tải danh sách...</p>
            ) : savedPosts.length === 0 ? (
                <p style={{ color: '#b0b3b8' }}>Chưa có bài viết nào được lưu.</p>
            ) : (
                savedPosts.map(post => {
                    const postId = post.post_id || post.id;
                    return (
                        <div key={postId}>
                            {collections.length > 0 && (
                                <select
                                    defaultValue={post.collection_id || ''}
                                    onChange={async (event) => {
                                        if (!event.target.value) return;
                                        await fetch(`${API_URL}/posts/${postId}/collection`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                                            body: JSON.stringify({ user_id: currentUser.user_id, collection_id: event.target.value })
                                        });
                                    }}
                                    style={{ marginBottom: 8 }}
                                >
                                    <option value="">Chọn bộ sưu tập</option>
                                    {collections.map(collection => (
                                        <option key={collection.collection_id} value={collection.collection_id}>{collection.name}</option>
                                    ))}
                                </select>
                            )}
                            <PostCard
                                post={{
                                    ...post,
                                    id: postId,
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
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default SavedPostsPage;