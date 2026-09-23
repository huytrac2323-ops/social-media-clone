import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../components/Avatar.jsx';
import { safeFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import {
  X,
  Heart,
  Eye,
  Bookmark,
  Share2,
  Send,
  MessageCircle,
  UserPlus,
  UserCheck,
  Wrench,
  Sparkles,
  Briefcase
} from 'lucide-react';

function ProjectDetailModal({ project, onClose, onLike, onCommentSubmit }) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(project.likes || 0);
  const [isLiked, setIsLiked] = useState(Boolean(project.isLiked));
  const [views, setViews] = useState(project.viewsCount || 0);
  const [isSaved, setIsSaved] = useState(Boolean(project.isSaved));
  const [comments, setComments] = useState(project.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(Boolean(project.isFriend));
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const commentsEndRef = useRef(null);

  // Tăng lượt xem thực tế khi mở Modal
  useEffect(() => {
    if (project?.id) {
      safeFetch(`/posts/${project.id}/view`, { method: 'POST' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.views_count === 'number') {
            setViews(data.views_count);
          } else {
            setViews(v => v + 1);
          }
        })
        .catch(() => setViews(v => v + 1));
    }
  }, [project?.id]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLike) {
      onLike(project.id);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để lưu bài viết!');
      return;
    }
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    try {
      const endpoint = isSaved ? `/posts/${project.id}/unsave` : `/posts/${project.id}/save`;
      await safeFetch(endpoint, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
    } catch {
      setIsSaved(!newSaved);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để theo dõi!');
      return;
    }
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);
    try {
      const res = await safeFetch(`/friends/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: currentUser.user_id,
          followee_id: project.userId
        })
      });
      if (!res.ok) setIsFollowing(!newStatus);
    } catch {
      setIsFollowing(!newStatus);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (!currentUser) {
      alert('Vui lòng đăng nhập để bình luận!');
      return;
    }

    const optimisticComment = {
      comment_id: 'temp-' + Date.now(),
      comment_text: commentInput.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUser.user_id,
      username: currentUser.username,
      profile_photo_url: currentUser.profile_photo_url,
      is_verified: currentUser.is_verified
    };

    setComments(prev => [...prev, optimisticComment]);
    if (onCommentSubmit) {
      onCommentSubmit(project.id, commentInput.trim());
    }
    setCommentInput('');

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenChatHire = () => {
    localStorage.setItem('activeChatUser', JSON.stringify({
      user_id: project.userId,
      username: project.author
    }));
    window.dispatchEvent(new Event('open-chat'));
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${project.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      alert(`Đường dẫn dự án:\n${url}`);
    }
  };

  const isOwner = currentUser && Number(currentUser.user_id) === Number(project.userId);
  const mainImage = project.imageUrl || (project.projectImages && project.projectImages[0]?.url);
  const caseStudyImages = (project.projectImages && project.projectImages.length > 0)
    ? project.projectImages
    : [];
  const tools = project.toolsUsed || [];
  const title = project.title || project.content?.slice(0, 70) || 'Tác phẩm sáng tạo';

  return (
    <div className="behance-modal-overlay" onClick={onClose}>
      <div
        className="behance-modal-container"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng modal góc trên */}
        <button
          type="button"
          className="behance-modal-close-floating"
          onClick={onClose}
          aria-label="Đóng chi tiết"
          title="Đóng (Esc)"
        >
          <X size={20} />
        </button>

        <div className="behance-modal-body">
          {/* ======================================================== */}
          {/* CỘT BÊN TRÁI (70%): TÁC PHẨM & CASE STUDY CUỘN DỌC        */}
          {/* ======================================================== */}
          <div className="behance-modal-left-col">
            {/* Header tác phẩm */}
            <div className="behance-project-header">
              <h1 className="behance-project-main-title">{title}</h1>
              {project.category && (
                <div className="behance-project-category-badge">
                  <Sparkles size={14} />
                  <span>{project.category}</span>
                </div>
              )}
            </div>

            {/* Mô tả / Giới thiệu Case Study */}
            {project.content && (
              <div className="behance-project-description">
                <p>{project.content}</p>
              </div>
            )}

            {/* Ảnh Bìa / Ảnh Chính kích thước lớn */}
            {mainImage && (
              <div className="behance-case-study-hero">
                <img
                  src={mainImage}
                  alt={title}
                  className="behance-hero-img"
                  loading="eager"
                />
              </div>
            )}

            {/* Danh sách các hình ảnh tiếp theo của Case Study */}
            {caseStudyImages.map((imgItem, index) => {
              const imgUrl = typeof imgItem === 'string' ? imgItem : imgItem.url;
              const imgCaption = typeof imgItem === 'object' ? imgItem.caption : '';
              if (!imgUrl || imgUrl === mainImage) return null;

              return (
                <div key={index} className="behance-case-study-block">
                  <img
                    src={imgUrl}
                    alt={`Case study ${index + 1}`}
                    className="behance-case-study-img"
                    loading="lazy"
                  />
                  {imgCaption && (
                    <div className="behance-case-study-caption">
                      {imgCaption}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Công cụ đã sử dụng (Tools Used) */}
            {tools && tools.length > 0 && (
              <div className="behance-tools-section">
                <div className="behance-section-label">
                  <Wrench size={16} />
                  <span>Công cụ sử dụng trong dự án:</span>
                </div>
                <div className="behance-tools-tags-list">
                  {tools.map((t, idx) => (
                    <span key={idx} className="behance-tool-badge">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer chân trang case study */}
            <div className="behance-case-study-footer">
              <span>Đăng vào: {new Date(project.time || Date.now()).toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span>{views} lượt xem</span>
              <span>•</span>
              <span>{likes} lượt yêu thích</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CỘT BÊN PHẢI (30% CỐ ĐỊNH): MẠNG XÃ HỘI, THUÊ & COMMENTS  */}
          {/* ======================================================== */}
          <aside className="behance-modal-right-col">
            {/* 1. KHỐI TÁC GIẢ & NÚT THEO DÕI */}
            <div className="behance-author-card">
              <div className="behance-author-info-row">
                <Avatar user={{ username: project.author, profile_photo_url: project.authorAvatar }} size={50} />
                <div className="behance-author-meta">
                  <div className="behance-author-name-row">
                    <span className="behance-author-name">{project.author}</span>
                    {project.isVerified && (
                      <svg className="verified-badge-icon" viewBox="0 0 24 24" width="14" height="14" fill="#0095f6">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <span className="behance-author-sub">Nhà sáng tạo NovaGen</span>
                </div>
              </div>

              {!isOwner && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`behance-follow-btn ${isFollowing ? 'following' : ''}`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={14} />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 2. NÚT CTA CỰC LỚN: LIÊN HỆ BÁO GIÁ / THUÊ NGAY */}
            {!isOwner && (
              <button
                type="button"
                className="behance-hire-cta-btn"
                onClick={handleOpenChatHire}
              >
                <Briefcase size={18} />
                <span>Nhắn tin báo giá / Thuê ngay</span>
              </button>
            )}

            {/* 3. BỘ CHỈ SỐ TƯƠNG TÁC XÃ HỘI */}
            <div className="behance-social-action-bar">
              <button
                type="button"
                className={`social-action-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title="Thích tác phẩm"
              >
                <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'currentColor'} />
                <span>{likes}</span>
              </button>

              <button
                type="button"
                className={`social-action-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSave}
                title="Lưu bài viết"
              >
                <Bookmark size={18} fill={isSaved ? '#3b82f6' : 'none'} color={isSaved ? '#3b82f6' : 'currentColor'} />
                <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
              </button>

              <div className="social-action-view" title={`${views} lượt xem`}>
                <Eye size={18} />
                <span>{views}</span>
              </div>

              <button
                type="button"
                className="social-action-btn"
                onClick={handleShare}
                title="Chia sẻ tác phẩm"
              >
                <Share2 size={18} />
                <span>{copiedLink ? 'Đã copy!' : 'Chia sẻ'}</span>
              </button>
            </div>

            {/* 4. KHU VỰC BÌNH LUẬN (COMMENTS STREAM) */}
            <div className="behance-comments-container">
              <div className="behance-comments-header">
                <MessageCircle size={17} />
                <span>Bình luận ({comments.length})</span>
              </div>

              <div className="behance-comments-list">
                {comments.length > 0 ? (
                  comments.map((cm, idx) => (
                    <div key={cm.comment_id || idx} className="behance-comment-item">
                      <Avatar user={{ username: cm.username, profile_photo_url: cm.profile_photo_url }} size={32} />
                      <div className="behance-comment-bubble">
                        <div className="behance-comment-user-row">
                          <span className="behance-comment-user">{cm.username}</span>
                          {cm.is_verified && (
                            <svg className="verified-badge-icon" viewBox="0 0 24 24" width="11" height="11" fill="#0095f6">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                          <span className="behance-comment-time">
                            {cm.created_at ? new Date(cm.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="behance-comment-text">{cm.comment_text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="behance-no-comments">
                    Hãy là người đầu tiên để lại bình luận cho tác phẩm này! 🎨
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* FORM GỬI BÌNH LUẬN */}
              <form className="behance-comment-input-form" onSubmit={handleSendComment}>
                {currentUser && <Avatar user={currentUser} size={28} />}
                <input
                  type="text"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Thêm nhận xét hoặc góp ý..."
                  className="behance-comment-input"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="behance-comment-send-btn"
                  aria-label="Gửi bình luận"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailModal;
