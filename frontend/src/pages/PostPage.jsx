import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import CreatePost from '../modals/CreatePost.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeft, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function PostPage({ onPostDeleted, onPostUpdated }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const userIdQuery = currentUser ? `?currentUserId=${currentUser.user_id}` : '';
        const response = await fetch(`${API_URL}/posts/${postId}${userIdQuery}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không tìm thấy bài viết.');
        }
        const data = await response.json();
        const formattedPost = {
          id: data.post_id,
          userId: data.user_id,
          user_id: data.user_id,
          author: data.username,
          time: data.created_at,
          content: data.caption,
          imageUrl: data.photo_url || null,
          likes: parseInt(data.like_count) || 0,
          shares: parseInt(data.share_count) || 0,
          isLiked: data.is_liked_by_user || false,
          isSaved: data.is_saved_by_user || false,
          comments: data.comments || [],
          authorAvatar: data.profile_photo_url,
          shared_post: data.shared_post,
        };
        setPost(formattedPost);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, currentUser]);

  const handleLike = async (postIdToLike) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để thích bài viết.');
    const token = localStorage.getItem('token');

    try {
      setPost(p => ({ ...p, isLiked: !p.isLiked, likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }));

      await fetch(`${API_URL}/posts/${postIdToLike}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
    } catch (err) {
      console.error("Lỗi khi thích bài viết:", err);
    }
  };

  const handleCommentSubmit = async (postIdToComment, commentText) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để bình luận.');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/posts/${postIdToComment}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: commentText,
          user_id: currentUser.user_id
        })
      });
      if (!response.ok) throw new Error('Lỗi khi bình luận');
      const newComment = await response.json();
      setPost(p => ({ ...p, comments: [...p.comments, newComment] }));
    } catch (err) {
      console.error("Lỗi khi bình luận:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      const response = await fetch(`${API_URL}/posts/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPost(p => ({ ...p, comments: p.comments.filter(c => c.comment_id !== commentId) }));
      }
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main className="app-feed-col" style={{ paddingBottom: '80px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: '500',
              marginBottom: '10px',
              width: 'fit-content'
            }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>

          {loading && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              Đang tải chi tiết bài viết...
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '30px',
              textAlign: 'center',
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          {!loading && post && (
            <PostCard
              post={post}
              onLike={handleLike}
              onCommentSubmit={handleCommentSubmit}
              onPostDeleted={() => {
                if (onPostDeleted) onPostDeleted();
                navigate('/');
              }}
              onPostUpdated={() => {
                if (onPostUpdated) onPostUpdated();
              }}
              onDeleteComment={handleDeleteComment}
            />
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

export default PostPage;
