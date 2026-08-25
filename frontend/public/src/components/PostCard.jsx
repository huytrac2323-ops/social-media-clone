import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import EditPostModal from '../modals/EditPostModal.jsx';
import { STRINGS } from '../constants/strings.js'; // Import tệp strings

const API_URL = 'https://social-media-clone-di9z.onrender.com/api';

function PostCard({ post, onLike, onCommentSubmit, onPostDeleted, onPostUpdated }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);

  const isOwner = currentUser && currentUser.user_id === post.userId;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);


  const handleCommentFormSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onCommentSubmit(post.id, commentText);
    setCommentText('');
  };

  const handleDelete = async () => {

    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/${post.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.user_id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Xóa bài viết thất bại.');
        
        alert('Xóa bài viết thành công!');
        if (onPostDeleted) {
            onPostDeleted();
        }
        if(window.location.pathname.startsWith('/post/')) {
            navigate('/');
        }

    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
  };

  const ClickableContent = ({ children }) => (
    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {children}
    </Link>
  );
    const handleShare = async () => {
        try {
            const response = await fetch(`${API_URL}/posts/${post.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            alert(data.message);
            // Có thể gọi callback để cập nhật lại state số lượng share trên giao diện nếu cần
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
        }
    };

  const authorUser = {
    username: post.author,
    profile_photo_url: post.authorAvatar
  };
    console.log("Dữ liệu PostCard nhận được:", post);
  return (
    <>
      {isEditModalOpen && (
        <EditPostModal 
          post={post}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={() => {
            setIsEditModalOpen(false);
            if(onPostUpdated) onPostUpdated();
          }}
        />
      )}


        <div className="post-card">
            <div className="post-header">
                <Link to={`/profile/${post.author}`} className="post-author-link">
                    <Avatar user={authorUser} className="mini-avatar" />
                    <div className="post-meta">
                        <h4 className="post-author">{post.author}</h4>
                        <span className="post-time">
                {post.time
                    ? new Date(post.time).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })
                    : 'Chưa có thời gian'}
              </span>
                    </div>
                </Link>

                {/* Nút menu 3 chấm của chủ bài viết */}
                {isOwner && (
                    <div className="post-menu-container" ref={menuRef}>
                        <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                            •••
                        </button>
                        {menuOpen && (
                            <div className="post-menu-dropdown">
                                <button onClick={() => { setIsEditModalOpen(true); setMenuOpen(false); }}>{STRINGS.EDIT}</button>
                                <button onClick={handleDelete} className="delete">{STRINGS.DELETE}</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Nội dung bài viết và hình ảnh nằm ở đây */}
            <ClickableContent>
                {post.content && <p className="post-content">{post.content}</p>}
                {post.imageUrl && <img src={post.imageUrl} alt="Nội dung bài viết" className="post-image" />}
            </ClickableContent>

            {/* THỐNG KÊ LƯỢT THÍCH, BÌNH LUẬN, CHIA SẺ (Nằm dưới nội dung ảnh/chữ) */}
            <div className="post-stats">
                <span>♥️ {post.likes} Lượt thích</span>
                <ClickableContent>
                    <span>💬 {post.comments.length} {STRINGS.COMMENTS}</span>
                </ClickableContent>
                <span>↗️ {post.sharesCount || 0} Lượt chia sẻ</span>
            </div>
            <hr />

            {/* CÁC NÚT HÀNH ĐỘNG THÍCH, BÌNH LUẬN, CHIA SẺ */}
            <div className="post-actions">
                <button className={`action-btn ${post.isLiked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
                    {post.isLiked ? '♥️ Đã thích' : '👍 Thích'}
                </button>
                <Link to={`/post/${post.id}`} className="action-btn">💬 {STRINGS.COMMENTS.charAt(0).toUpperCase() + STRINGS.COMMENTS.slice(1)}</Link>
                <button className="action-btn" onClick={handleShare}>↗️ Chia sẻ</button>
            </div>
            <hr />
        <div className="comments-section">
            {post.comments.slice(0, 2).map(comment => (
                <div key={comment.comment_id} className="comment-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link to={`/profile/${comment.username}`} className="comment-author-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Avatar
                            user={{ username: comment.username, profile_photo_url: comment.profile_photo_url }}
                            className="mini-avatar"
                            style={{ width: '24px', height: '24px' }}
                        />
                        <span className="comment-author">{comment.username}: </span>
                    </Link>
                    <span className="comment-text">{comment.comment_text}</span>
                    {/* Thêm thời gian nhỏ bên cạnh bình luận nếu muốn */}
                    <span style={{ fontSize: '10px', color: '#888', marginLeft: 'auto' }}>
            {comment.created_at ? new Date(comment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
                </div>
            ))}
          {post.comments.length > 2 && (
              <ClickableContent>
                  <p style={{ color: '#8e8e8e', cursor: 'pointer', marginTop: '10px' }}>
                      {STRINGS.VIEW_ALL_COMMENTS} {post.comments.length} {STRINGS.COMMENTS}
                  </p>
              </ClickableContent>
          )}
          {currentUser && (
            <form onSubmit={handleCommentFormSubmit} className="comment-form">
              <input
                type="text"
                placeholder={STRINGS.WRITE_A_COMMENT}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn-send-comment">Đăng</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default PostCard;