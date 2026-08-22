import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from './PostCard';
import { useAuth } from './AuthContext';

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function PostPage() {
  const { postId } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      setPost(null);
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
          author: data.username,
          time: data.created_at,
          content: data.caption,
          imageUrl: data.photo_url ? `https://social-media-clone-di9z.onrender.com/uploads${data.photo_url}` : null,
          likes: data.like_count,
          isLiked: data.is_liked_by_user,
          comments: data.comments || [],
          authorAvatar: data.profile_photo_url // Đảm bảo lấy avatar
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
    try {
      await fetch(`${API_URL}/posts/${postIdToLike}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
      setPost(p => ({ ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }));
    } catch (err) {
      console.error("Lỗi khi thích bài viết:", err);
    }
  };

  const handleCommentSubmit = async (postIdToComment, commentText) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để bình luận.');
    try {
      const response = await fetch(`${API_URL}/posts/${postIdToComment}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText, user_id: currentUser.user_id })
      });
      if (!response.ok) throw new Error('Lỗi khi bình luận');
      const newComment = await response.json();
      setPost(p => ({ ...p, comments: [...p.comments, newComment] }));
    } catch (err) {
      console.error("Lỗi khi bình luận:", err);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải bài viết...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Lỗi: {error}</div>;
  if (!post) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Không tìm thấy bài viết.</div>;

  return (
    <div className="fb-body">
        <main className="fb-feed" style={{ justifyContent: 'center' }}>
            <PostCard
                post={post}
                onLike={handleLike}
                onCommentSubmit={handleCommentSubmit}
            />
        </main>
    </div>
  );
}

export default PostPage;