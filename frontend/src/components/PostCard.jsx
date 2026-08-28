import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import EditPostModal from '../modals/EditPostModal.jsx';
import { STRINGS } from '../constants/strings.js'; // Import tệp strings


// Tự động nhận diện môi trường Localhost hay Online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';

function PostCard({ post, onLike, onCommentSubmit, onPostDeleted, onPostUpdated }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [loading, setLoading] = useState(false);
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

    const handleShare = async (postIdToShare) => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Vui lòng đăng nhập để chia sẻ bài viết.');

        // 1. Hiển thị hộp thoại cho phép nhập lời tựa (caption)
        const userCaption = window.prompt("Nhập nội dung chia sẻ của bạn (Có thể để trống):");

        // 2. Nếu người dùng bấm "Hủy" (Cancel), biến sẽ là null -> Dừng lại không share nữa
        if (userCaption === null) return;

        try {
            const response = await fetch(`${API_URL}/posts/${postIdToShare}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // 3. Gửi caption mà người dùng vừa gõ lên cho Backend
                body: JSON.stringify({ caption: userCaption })
            });

            if (!response.ok) {
                const errData = await response.json();
                return alert(errData.message || 'Có lỗi xảy ra khi chia sẻ');
            }

            alert('Chia sẻ thành công! Tải lại trang để xem bài viết mới.');
        } catch (err) {
            console.error("Lỗi khi chia sẻ bài viết:", err);
        }
    };
    // Thêm hàm xử lý gọi API lưu bài viết
    const handleSavePost = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return alert('Vui lòng đăng nhập để lưu bài viết.');
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/posts/${postId}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: currentUser?.user_id })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Lỗi thao tác từ server');
            }

            // Đổi trạng thái qua lại: Nếu chưa lưu thì thành đã lưu, và ngược lại
            setIsSaved(!isSaved);
            alert(data.message || 'Thành công!');
        } catch (err) {
            console.error('Lỗi chi tiết:', err);
            alert(`Lỗi: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };



    const authorUser = {
        username: post.author || post.username,
        profile_photo_url: post.authorAvatar || post.profile_photo_url
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
                <Link
                    to={(post.author || post.username) ? `/profile/${post.author || post.username}` : '#'} >
                    <Avatar user={authorUser} className="mini-avatar" />
                    <div className="post-meta">
                        <h4 className="post-author">{post.author}</h4>
                        <span className="post-time">
                {post.time
                    ? new Date(comment.created_at).toLocaleString('vi-VN', {
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
            <div className="post-body">
                {post.content && <p className="post-content">{post.content}</p>}
                {post.imageUrl && <img src={post.imageUrl} alt="Nội dung bài viết" className="post-image" />}

                {/* NẾU LÀ BÀI CHIA SẺ -> VẼ KHUNG BÀI GỐC Ở ĐÂY */}
                {post.shared_post && (
                    <div className="shared-post-container" style={{ border: '1px solid #444', padding: '12px', borderRadius: '8px', marginTop: '15px', backgroundColor: '#242526' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <img src={post.shared_post.profile_photo_url} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                            <strong>{post.shared_post.username}</strong>
                        </div>
                        {post.shared_post.caption && <p style={{ fontSize: '14px' }}>{post.shared_post.caption}</p>}
                        {post.shared_post.photo_url && <img src={post.shared_post.photo_url} alt="Shared content" style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }} />}
                    </div>
                )}
            </div>

            {/* THỐNG KÊ LƯỢT THÍCH, BÌNH LUẬN, CHIA SẺ (Nằm dưới nội dung ảnh/chữ) */}
            <div className="post-stats">
                <span>♥️ {post.likes} Lượt thích</span>

                    <span>💬 {post.comments.length} {STRINGS.COMMENTS}</span>

                <span>↗️ {post.sharesCount || 0} Lượt chia sẻ</span>
            </div>
            <hr />

            {/* CÁC NÚT HÀNH ĐỘNG THÍCH, BÌNH LUẬN, CHIA SẺ */}
            <div className="post-actions">
                <button className={`action-btn ${post.isLiked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
                    {post.isLiked ? '♥️ Đã thích' : '👍 Thích'}
                </button>
                <button
                    onClick={() => handleSavePost(post.id)}
                    disabled={loading}
                    style={{
                        background: isSaved ? '#2d88ff' : 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontWeight: isSaved ? 'bold' : 'normal'
                    }}
                >
                    {loading ? '⏳ Đang xử lý...' : (isSaved ? '🔖 Đã lưu' : '🔖 Lưu bài viết')}
                </button>
                <Link to={`/post/${post.id}`} className="action-btn">💬 {STRINGS.COMMENTS.charAt(0).toUpperCase() + STRINGS.COMMENTS.slice(1)}</Link>
                <button className="action-btn" onClick={() => handleShare(post.id)}>↗️ Chia sẻ</button>
            </div>
            <hr />

            <div className="comments-section">
                {post.comments.slice(0, 2).map(comment => (
                    <div key={comment.comment_id || comment.id} className="comment-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>

                        <Link to={comment.username ? `/profile/${comment.username}` : '#'} className="comment-author-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Avatar user={{ username: comment.username, profile_photo_url: comment.profile_photo_url }} className="mini-avatar" style={{ width: '24px', height: '24px' }} />
                            <span className="comment-author">{comment.username}: </span>
                        </Link>

                        <span className="comment-text">{comment.comment_text || comment.content}</span>

                        {/* THỜI GIAN BẮT BUỘC NẰM Ở ĐÂY */}
                        <span style={{ fontSize: '10px', color: '#888', marginLeft: 'auto' }}>
                {comment.created_at
                    ? new Date(comment.created_at).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : ''}
            </span>

                        {/* NÚT XÓA BẮT BUỘC NẰM Ở ĐÂY */}
                        {currentUser && currentUser.user_id === comment.user_id && onDeleteComment && (
                            <button
                                onClick={() => onDeleteComment(comment.comment_id || comment.id)}
                                style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', marginLeft: '10px', padding: 0 }}
                            >
                                Xóa
                            </button>
                        )}

                    </div>
                ))} {/* 👈 DẤU ĐÓNG VÒNG LẶP PHẢI NẰM SAU CÙNG */}

                {post.comments.length > 2 && (
                    <p style={{ color: '#8e8e8e', cursor: 'pointer', marginTop: '10px' }}>
                        {STRINGS.VIEW_ALL_COMMENTS} {post.comments.length} {STRINGS.COMMENTS}
                    </p>
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