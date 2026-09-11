import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import EditPostModal from '../modals/EditPostModal.jsx';
import { STRINGS } from '../constants/strings.js';
import '../styles/PostCard.css';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  UserPlus,
  Edit3,
  Trash2,
  Send,
  X,
  Clock,
  PlusCircle,
  Repeat
} from 'lucide-react';
import { safeFetch } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function PostCard({ post, friendUserIds, onLike, onCommentSubmit, onPostDeleted, onPostUpdated, onDeleteComment }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);
  const shareMenuRef = useRef(null);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [loading, setLoading] = useState(false);
  const isOwner = currentUser && Number(currentUser.user_id) === Number(post.userId);
  const isFriend = Boolean(post.isFriend || (currentUser && friendUserIds?.has(Number(post.userId))));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(post.friendRequestSent || false);

  const mediaUrl = (url) => url?.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const maxLength = 240;
  const shouldTruncate = post.content && post.content.length > maxLength;
  const displayedContent = (isExpanded || !shouldTruncate)
    ? post.content
    : post.content.slice(0, maxLength) + '...';

  const handleCommentFormSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onCommentSubmit(post.id, commentText);
    setCommentText('');
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('a') ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('.post-menu-dropdown') ||
      e.target.closest('.comment-form') ||
      e.target.closest('.image-modal-view')
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
      if (onPostDeleted) onPostDeleted();
      if (window.location.pathname.startsWith('/post/')) {
        navigate('/');
      }
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleShare = async (postIdToShare) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để chia sẻ bài viết.');

    const userCaption = window.prompt("Nhập nội dung chia sẻ của bạn (Có thể để trống):");
    if (userCaption === null) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postIdToShare}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ caption: userCaption })
      });

      if (!response.ok) {
        const errData = await response.json();
        return alert(errData.message || 'Có lỗi xảy ra khi chia sẻ');
      }

      alert('Chia sẻ thành công! Đang làm mới bảng tin.');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error("Lỗi khi chia sẻ bài viết:", err);
    }
  };

  const handleSavePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để lưu bài viết.');

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/posts/${postId}/${isSaved ? 'unsave' : 'save'}`, {
        method: isSaved ? 'DELETE' : 'POST',
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

      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Lỗi khi lưu bài:', err);
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    const myId = Number(currentUser?.user_id || currentUser?.id);
    const targetId = Number(post.userId);

    if (!myId || !targetId) return alert('Lỗi: Thiếu thông tin ID!');
    if (myId === targetId) return alert('Không thể tự kết bạn với chính mình!');

    // Cập nhật giao diện tức thì
    setFriendRequestSent(true);

    try {
      const res = await safeFetch('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: myId, addressee_id: targetId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFriendRequestSent(false);
        alert(data.error || data.message || 'Lỗi gửi kết bạn');
      }
    } catch (err) {
      setFriendRequestSent(false);
      console.error("Lỗi kết bạn:", err);
      alert('Không thể kết nối máy chủ.');
    }
  };

  const authorUser = {
    username: post.author || post.username,
    profile_photo_url: post.authorAvatar || post.profile_photo_url
  };

  const formattedTime = post.time ? new Date(post.time).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return (
    <>
      {isEditModalOpen && (
        <EditPostModal
          post={post}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={() => {
            setIsEditModalOpen(false);
            if (onPostUpdated) onPostUpdated();
          }}
        />
      )}

      <article className="modern-post-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {/* Post Header */}
        <div className="post-header">
          <Link
            to={(post.author || post.username) ? `/profile/${post.author || post.username}` : '#'}
            className="post-author-group"
          >
            <Avatar user={authorUser} size={40} />
            <div className="post-meta">
              <span className="post-author-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {post.author || post.username}
                {(post.isVerified || post.is_verified) && (
                  <svg className="verified-badge-icon" viewBox="0 0 24 24" width="14" height="14" fill="#0095f6" aria-label="Tài khoản đã xác minh">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
              </span>
              <span className="post-time-stamp" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} />
                {formattedTime || 'Vừa xong'}
              </span>
            </div>
          </Link>

          <div className="post-header-actions">
            {currentUser && Number(currentUser.user_id || currentUser.id) !== Number(post.userId) && !isFriend && (
              <button
                type="button"
                className="btn-add-friend-post"
                onClick={handleAddFriend}
                disabled={friendRequestSent}
                title={friendRequestSent ? 'Đã gửi lời mời' : 'Kết bạn'}
              >
                <UserPlus size={13} />
                <span>{friendRequestSent ? 'Đã gửi' : 'Thêm bạn'}</span>
              </button>
            )}

            {isOwner && (
              <div className="post-menu-container" ref={menuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="post-menu-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Tùy chọn bài viết"
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <div className="post-menu-dropdown">
                    <button type="button" onClick={() => { setIsEditModalOpen(true); setMenuOpen(false); }}>
                      <Edit3 size={14} />
                      <span>{STRINGS.EDIT}</span>
                    </button>
                    <button type="button" onClick={handleDelete} className="delete">
                      <Trash2 size={14} />
                      <span>{STRINGS.DELETE}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <div className="post-caption-box">
            <p style={{ margin: 0 }}>
              {displayedContent}
              {shouldTruncate && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="post-read-more-btn"
                >
                  {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </p>
          </div>
        )}

        {/* Post Image */}
        {post.imageUrl && (
          <div className="post-media-box">
            <img
              src={mediaUrl(post.imageUrl)}
              alt="Hình ảnh bài viết"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageViewerOpen(true);
              }}
              loading="lazy"
            />
          </div>
        )}

        {/* Shared Post Container */}
        {post.shared_post && (
          <div className="shared-post-nested-card">
            <div className="shared-post-header">
              <Avatar user={{ username: post.shared_post.username, profile_photo_url: post.shared_post.profile_photo_url }} size={24} />
              <strong style={{ fontSize: '13px' }}>{post.shared_post.username}</strong>
            </div>
            {post.shared_post.caption && (
              <div className="shared-post-caption">{post.shared_post.caption}</div>
            )}
            {post.shared_post.photo_url && (
              <img
                src={mediaUrl(post.shared_post.photo_url)}
                alt="Nội dung bài chia sẻ"
                style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }}
              />
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="post-action-bar">
          <div className="post-action-group">
            {/* Like */}
            <button
              type="button"
              onClick={() => onLike(post.id)}
              className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
              title="Thích"
            >
              <Heart size={20} />
              <span>{post.likes ?? 0}</span>
            </button>

            {/* Comment */}
            <Link
              to={`/post/${post.id}`}
              className="post-action-btn"
              title="Bình luận"
              style={{ textDecoration: 'none' }}
            >
              <MessageCircle size={20} />
              <span>{post.comments ? post.comments.length : 0}</span>
            </Link>

            {/* Share */}
            <div style={{ position: 'relative' }} ref={shareMenuRef}>
              <button
                type="button"
                className="post-action-btn"
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                title="Chia sẻ bài viết"
              >
                <Share2 size={19} />
              </button>
              {shareMenuOpen && (
                <div className="post-share-menu-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      setShareMenuOpen(false);
                      if (window.innerWidth > 768) {
                        alert('Tính năng chia sẻ và đăng Story chỉ hỗ trợ trên thiết bị di động.');
                        return;
                      }
                      window.dispatchEvent(new CustomEvent('open-story-with-post', { detail: post }));
                    }}
                  >
                    <PlusCircle size={15} color="var(--accent-primary, #0095f6)" />
                    <span>Chia sẻ lên Story</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareMenuOpen(false);
                      handleShare(post.id);
                    }}
                  >
                    <Repeat size={15} />
                    <span>Đăng lại lên bảng tin</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => handleSavePost(post.id)}
            disabled={loading}
            className={`post-action-btn ${isSaved ? 'saved' : ''}`}
            title={isSaved ? "Đã lưu" : "Lưu bài viết"}
          >
            <Bookmark size={20} />
          </button>
        </div>

        {/* Comments Preview & Input */}
        <div className="post-comments-container">
          {post.comments && post.comments.slice(0, 2).map(comment => (
            <div key={comment.comment_id || comment.id} className="post-comment-item">
              <Avatar user={{ username: comment.username, profile_photo_url: comment.profile_photo_url }} size={26} />
              <div className="comment-bubble">
                <Link
                  to={comment.username ? `/profile/${comment.username}` : '#'}
                  className="comment-author-name"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  {comment.username}
                  {comment.is_verified && (
                    <svg className="verified-badge-icon" viewBox="0 0 24 24" width="12" height="12" fill="#0095f6">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </Link>
                <span className="comment-text-body">{comment.comment_text || comment.content}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span className="comment-time">
                    {comment.created_at ? new Date(comment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {currentUser && Number(currentUser.user_id || currentUser.id) === Number(comment.user_id) && onDeleteComment && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(comment.comment_id || comment.id)}
                      className="comment-delete-btn"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {post.comments && post.comments.length > 2 && (
            <Link to={`/post/${post.id}`} className="view-all-comments-link">
              Xem tất cả {post.comments.length} bình luận...
            </Link>
          )}

          {currentUser && (
            <form onSubmit={handleCommentFormSubmit} className="comment-input-form">
              <input
                type="text"
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn-submit-comment" disabled={!commentText.trim()}>
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      </article>

      {/* Fullscreen Image Zoom Modal */}
      {isImageViewerOpen && (
        <div
          className="modal-backdrop image-modal-view"
          onClick={() => setIsImageViewerOpen(false)}
          style={{ cursor: 'zoom-out' }}
        >
          <button
            type="button"
            onClick={() => setIsImageViewerOpen(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100001
            }}
          >
            <X size={24} />
          </button>
          <img
            src={mediaUrl(post.imageUrl)}
            alt="Full size"
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
            }}
          />
        </div>
      )}
    </>
  );
}

export default PostCard;