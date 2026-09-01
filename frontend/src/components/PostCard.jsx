import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import EditPostModal from '../modals/EditPostModal.jsx';
import { STRINGS } from '../constants/strings.js'; // Import tệp strings
import '../styles/PostCard.css';


// Tự động nhận diện môi trường Localhost hay Online
const API_URL = 'https://social-media-clone-di9z.onrender.com/api';



function PostCard({ post, onLike, onCommentSubmit, onPostDeleted, onPostUpdated, onDeleteComment }) {  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [loading, setLoading] = useState(false);
  const isOwner = currentUser && currentUser.user_id === post.userId;
    const [isExpanded, setIsExpanded] = useState(false);
    // Thêm state quản lý việc bật/tắt khung xem full ảnh
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

    const maxLength = 250;
    const shouldTruncate = post.content && post.content.length > maxLength;
    const displayedContent = (isExpanded || !shouldTruncate)
        ? post.content
        : post.content.slice(0, maxLength) + '...';



  const handleCommentFormSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onCommentSubmit(post.id, commentText);
  };
    // Thêm hàm xử lý khi click vào thẻ bài viết để xem chi tiết
    const handleCardClick = (e) => {
        // Nếu người dùng bấm vào avatar, tên tác giả, nút 3 chấm hoặc các nút hành động thì không chuyển trang
        if (
            e.target.closest('a') ||
            e.target.closest('button') ||
            e.target.closest('.post-menu-container') ||
            e.target.closest('.comments-section')
        ) {
            return;
        }
        navigate(`/post/${post.id}`);
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




          <div className="post-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="post-header">
                <Link
                    to={(post.author || post.username) ? `/profile/${post.author || post.username}` : '#'} >
                    <Avatar user={authorUser} className="mini-avatar" />
                    <div className="post-meta">
                        <h4 className="post-author">{post.author}</h4>
                        <span className="post-time">
                        {post.time
                            ? new Date(post.time).toLocaleString('vi-VN', { // 👈 Đổi comment.created_at thành post.time
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

                {/* 👇 THÊM NÚT KẾT BẠN Ở ĐÂY (Kế bên tên tác giả) */}
                {currentUser && Number(currentUser.user_id || currentUser.id) !== Number(post.userId) && (
                    <button
                        onClick={async () => {
                            // Lấy trực tiếp ID người đăng nhập và ID tác giả bài viết
                            const myId = Number(currentUser.user_id || currentUser.id);

                            // Trong ảnh console, bài viết chứa tác giả ở trường userId, không phải user_id
                            const targetId = Number(post.userId);

                            // In ra console để kiểm tra chắc chắn dữ liệu không bị trống
                            console.log("Đang gửi yêu cầu từ myId:", myId, "đến targetId:", targetId);

                            if (!myId || !targetId) {
                                return alert(`Lỗi: Thiếu ID! myId=${myId}, targetId=${targetId}`);
                            }

                            if (myId === targetId) {
                                return alert("Không thể tự kết bạn với chính mình!");
                            }

                            try {
                                const res = await fetch(`${API_URL}/friends/request`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    // 👇 ĐỔI TÊN BIẾN TẠI ĐÂY ĐỂ KHỚP VỚI BACKEND
                                    body: JSON.stringify({ requester_id: myId, addressee_id: targetId })
                                });
                                const data = await res.json();

                                if (res.ok) {
                                    alert("Đã gửi yêu cầu kết bạn!");
                                } else {
                                    alert(`Lỗi backend: ${data.error || data.message}`);
                                }
                            } catch (err) {
                                console.error("Lỗi gửi kết bạn:", err);
                            }
                        }}
                        style={{ background: '#0084ff', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '10px' }}
                    >
                        ➕ Thêm bạn
                    </button>
                )}





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
                {post.content && (
                    <div className="post-content-wrapper">
                        <p className="post-content">{displayedContent}</p>
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{ background: 'none', border: 'none', color: '#1877f2', cursor: 'pointer', padding: 0, fontWeight: 'bold', marginTop: '6px' }}
                            >
                                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                            </button>
                        )}
                    </div>
                )}

                {post.imageUrl && (
                    <>
                        <img
                            src={post.imageUrl}
                            alt="Nội dung bài viết"
                            className="post-image"
                            onClick={(e) => {
                                e.stopPropagation(); // 👈 Chặn không cho sự kiện lan ra ngoài khung bài viết
                                setIsImageViewerOpen(true);
                            }}
                            style={{ cursor: 'zoom-in' }}
                        />

                        {/* Modal hiển thị Full hình ảnh khi click vào */}
                        {isImageViewerOpen && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation(); // 👈 Chặn lan truyền khi bấm vào nền tối của modal
                                    setIsImageViewerOpen(false);
                                }}
                                style={{
                                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex',
                                    justifyContent: 'center', alignItems: 'center', zIndex: 9999, cursor: 'zoom-out'
                                }}
                            >
                                <img
                                    src={post.imageUrl}
                                    alt="Full size"
                                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px' }}
                                />
                            </div>
                        )}
                    </>
                )}

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

              {/* HÀNG ICON VÀ SỐ LƯỢNG NẰM LIỀN KỀ NHAU Ở DƯỚI */}
              <div className="post-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #efefef' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

                      {/* Nút Thích + Số lượng like */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                              onClick={() => onLike(post.id)}
                              className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                              title="Thích"
                              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                          >
                              {post.isLiked ? '❤️' : '🤍'}
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{post.likes ?? 0}</span>
                      </div>

                      {/* Nút Bình luận + Số lượng bình luận */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Link to={`/post/${post.id}`} className="action-btn" title="Bình luận" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', textDecoration: 'none' }}>
                              💬
                          </Link>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{post.comments ? post.comments.length : 0}</span>
                      </div>

                      {/* Nút Chia sẻ */}
                      <button
                          className="action-btn"
                          title="Chia sẻ"
                          onClick={() => handleShare(post.id)}
                          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                      >
                          ↗️
                      </button>
                  </div>

                  {/* Nút Lưu bài viết ở góc phải */}
                  <button
                      onClick={() => handleSavePost(post.id)}
                      disabled={loading}
                      title={isSaved ? "Đã lưu" : "Lưu bài viết"}
                      style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          color: isSaved ? '#2d88ff' : 'inherit'
                      }}
                  >
                      {isSaved ? '🔖' : '📑'}
                  </button>
              </div>
              <hr />

              {/* DANH SÁCH BÌNH LUẬN & Ô NHẬP BÌNH LUẬN */}
              <div className="comments-section">
                  {post.comments && post.comments.slice(0, 2).map(comment => (
                      <div key={comment.comment_id || comment.id} className="comment-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '0 12px' }}>

                          <Link to={comment.username ? `/profile/${comment.username}` : '#'} className="comment-author-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit' }}>
                              <Avatar user={{ username: comment.username, profile_photo_url: comment.profile_photo_url }} className="mini-avatar" style={{ width: '24px', height: '24px' }} />
                              <span className="comment-author" style={{ fontWeight: '600', fontSize: '13px' }}>{comment.username}: </span>
                          </Link>

                          <span className="comment-text" style={{ fontSize: '13px' }}>{comment.comment_text || comment.content}</span>

                          <span style={{ fontSize: '10px', color: '#888', marginLeft: 'auto' }}>
                            {comment.created_at
                                ? new Date(comment.created_at).toLocaleString('vi-VN', {
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : ''}
                        </span>

                          {/* NÚT XÓA BÌNH LUẬN (Hiển thị khi đúng là chủ nhân comment) */}
                          {currentUser && Number(currentUser.user_id || currentUser.id) === Number(comment.user_id) && onDeleteComment && (
                              <button
                                  onClick={() => onDeleteComment(comment.comment_id || comment.id)}
                                  style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', padding: 0 }}
                              >
                                  Xóa
                              </button>
                          )}
                      </div>
                  ))}

                  {post.comments && post.comments.length > 2 && (
                      <Link to={`/post/${post.id}`} style={{ color: '#8e8e8e', cursor: 'pointer', margin: '8px 12px', textDecoration: 'none', display: 'block', fontSize: '13px' }}>
                          Xem tất cả {post.comments.length} bình luận
                      </Link>
                  )}

                  {currentUser && (
                      <form onSubmit={handleCommentFormSubmit} className="comment-form">
                          <input
                              type="text"
                              placeholder="Thêm bình luận..."
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