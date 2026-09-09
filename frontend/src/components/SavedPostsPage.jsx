import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PostCard from './PostCard.jsx';
import SidebarNav from './SidebarNav.jsx';
import ChatWidget from './ChatWidget/ChatWidget';
import CreatePost from '../modals/CreatePost.jsx';
import { Bookmark, FolderPlus, Folder, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function SavedPostsPage() {
    const { currentUser } = useAuth();
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [newCollection, setNewCollection] = useState('');
    const [showCreatePost, setShowCreatePost] = useState(false);

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
        if (currentUser?.user_id) {
            fetch(`${API_URL}/saved-collections/${currentUser.user_id}`)
                .then(res => res.ok ? res.json() : [])
                .then(setCollections)
                .catch(console.error);
        }
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
        <div className="app-shell">
            <div className="app-layout">
                <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

                <main className="app-feed-col" style={{ paddingBottom: '80px' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bookmark size={22} color="#60a5fa" />
                            Bài viết đã lưu
                        </h1>

                        {/* Create Collection Form */}
                        <form onSubmit={createCollection} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <input
                                value={newCollection}
                                onChange={e => setNewCollection(e.target.value)}
                                placeholder="Tạo bộ sưu tập mới..."
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13.5px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 18px',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    background: 'var(--accent-gradient)',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <FolderPlus size={16} />
                                <span>Tạo</span>
                            </button>
                        </form>

                        {/* Collection Filter Pills */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => { setSelectedCollection(null); loadSavedPosts(); }}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    border: '1px solid',
                                    borderColor: selectedCollection === null ? '#3b82f6' : 'var(--border-subtle)',
                                    background: selectedCollection === null ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
                                    color: selectedCollection === null ? '#60a5fa' : 'var(--text-secondary)',
                                    fontSize: '12.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Tất cả bài lưu
                            </button>
                            {collections.map(collection => (
                                <button
                                    key={collection.collection_id}
                                    type="button"
                                    onClick={async () => {
                                        setSelectedCollection(collection.collection_id);
                                        await loadSavedPosts(collection.collection_id);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 14px',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid',
                                        borderColor: selectedCollection === collection.collection_id ? '#3b82f6' : 'var(--border-subtle)',
                                        background: selectedCollection === collection.collection_id ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
                                        color: selectedCollection === collection.collection_id ? '#60a5fa' : 'var(--text-secondary)',
                                        fontSize: '12.5px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Folder size={13} />
                                    <span>{collection.name} ({collection.post_count || 0})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                            Đang tải danh sách bài viết...
                        </div>
                    ) : savedPosts.length === 0 ? (
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '48px 24px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            marginTop: '20px'
                        }}>
                            <Bookmark size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                            <p style={{ fontSize: '15px' }}>Chưa có bài viết nào được lưu.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                            {savedPosts.map(post => {
                                const postId = post.post_id || post.id;
                                return (
                                    <div key={postId}>
                                        {collections.length > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
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
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-subtle)',
                                                        background: 'var(--bg-elevated)',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '12px',
                                                        outline: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="">Chuyển vào bộ sưu tập...</option>
                                                    {collections.map(collection => (
                                                        <option key={collection.collection_id} value={collection.collection_id}>{collection.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <PostCard
                                            post={{
                                                ...post,
                                                id: postId,
                                                userId: post.user_id || post.userId,
                                                author: post.author || post.username,
                                                authorAvatar: post.authorAvatar || post.profile_photo_url,
                                                time: post.created_at || post.time,
                                                content: post.content || post.caption,
                                                imageUrl: post.photo_url || post.imageUrl,
                                                likes: post.likes || post.like_count || 0,
                                                shares: post.sharesCount || 0,
                                                comments: post.comments || [],
                                                isSaved: true
                                            }}
                                            onPostUpdated={() => loadSavedPosts(selectedCollection)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                <ChatWidget />
            </div>

            {showCreatePost && currentUser && (
                <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Tạo bài viết</h2>
                            <button type="button" className="close-btn" onClick={() => setShowCreatePost(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <CreatePost onPostCreated={() => setShowCreatePost(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default SavedPostsPage;