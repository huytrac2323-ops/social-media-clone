import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
          imageUrl: data.photo_url || null,
          likes: parseInt(data.like_count) || 0,
          shares: parseInt(data.share_count) || 0, // THÊM: Lấy số lượng share từ Backend
          isLiked: data.is_liked_by_user,
          comments: data.comments || [],
          authorAvatar: data.profile_photo_url
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
    const token = localStorage.getItem('token'); // Lấy token

    try {
      // Cập nhật UI trước cho mượt
      setPost(p => ({ ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }));

      await fetch(`${API_URL}/posts/${postIdToLike}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // THÊM TOKEN VÀO HEADER
        }
        // Xóa body chứa user_id vì Backend đã tự lấy từ Token
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
          'Authorization': `Bearer ${token}` // THÊM TOKEN VÀO HEADER
        },
        body: JSON.stringify({ comment_text: commentText }) // Chỉ gửi nội dung comment
      });
      if (!response.ok) throw new Error('Lỗi khi bình luận');
      const newComment = await response.json();
      setPost(p => ({ ...p, comments: [...p.comments, newComment] }));
    } catch (err) {
      console.error("Lỗi khi bình luận:", err);
    }
  };

  // THÊM MỚI: Hàm xử lý chia sẻ bài viết
  const handleShare = async (postIdToShare) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để chia sẻ bài viết.');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/posts/${postIdToShare}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        return alert(errData.message || 'Có lỗi xảy ra khi chia sẻ');
      }

      const data = await response.json();
      // Cập nhật lại số lượng share hiển thị trên UI
      setPost(p => ({ ...p, shares: data.sharesCount }));
      alert('Chia sẻ thành công!');
    } catch (err) {
      console.error("Lỗi khi chia sẻ bài viết:", err);
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
              onShare={handleShare} // TRUYỀN HÀM XUỐNG COMPONENT CON
          />
        </main>
      </div>
  );
}

export default PostPage;