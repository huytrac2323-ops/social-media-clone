import React, { useState } from 'react';
import Avatar from './Avatar.jsx';
import { Bookmark, Heart, Eye, Sparkles } from 'lucide-react';
import { safeFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';

function ProjectCard({ post, onOpenModal, onLike }) {
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Lấy ảnh hiển thị chính (thumbnail chiếm ~80% diện tích thẻ)
  const displayImage = post.imageUrl || (post.projectImages && post.projectImages[0]?.url) || null;
  const projectTitle = post.title || (post.content ? (post.content.length > 55 ? post.content.slice(0, 55) + '...' : post.content) : 'Dự án sáng tạo');
  const projectCategory = post.category || (post.toolsUsed && post.toolsUsed[0]) || 'Thiết kế';
  const views = post.viewsCount || 0;
  const likes = post.likes || 0;

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để lưu bài viết!');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    const newStatus = !isSaved;
    setIsSaved(newStatus);

    try {
      const endpoint = isSaved ? `/posts/${post.id}/unsave` : `/posts/${post.id}/save`;
      const res = await safeFetch(endpoint, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
      if (!res.ok) {
        setIsSaved(!newStatus);
      }
    } catch {
      setIsSaved(!newStatus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(post.id);
    }
  };

  return (
    <article
      className="behance-project-card"
      onClick={() => onOpenModal && onOpenModal(post)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenModal && onOpenModal(post);
        }
      }}
      aria-label={`Xem dự án ${projectTitle} của ${post.author}`}
    >
      {/* KHU VỰC THUMBNAIL (CHIẾM ~80% DIỆN TÍCH THẺ) */}
      <div className="behance-card-media-wrap">
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={projectTitle}
            className="behance-card-thumbnail"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="behance-card-text-fallback">
            <div className="fallback-decor-icon">
              <Sparkles size={24} />
            </div>
            <p className="fallback-excerpt">
              {post.content || 'Dự án chia sẻ từ nhà sáng tạo NovaGen'}
            </p>
          </div>
        )}

        {/* LỚP PHỦ HOVER HIỆU ỨNG BEHANCE */}
        <div className="behance-card-hover-overlay">
          {/* Nút Lưu (Save / Bookmark) góc trên bên phải */}
          <div className="hover-top-row">
            <button
              type="button"
              className={`behance-save-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleSaveClick}
              title={isSaved ? 'Đã lưu' : 'Lưu dự án'}
              aria-label={isSaved ? 'Bỏ lưu' : 'Lưu dự án'}
            >
              <Bookmark size={15} fill={isSaved ? '#ffffff' : 'none'} color="#ffffff" />
              <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>

          {/* Tag thể loại và xem chi tiết ở góc dưới */}
          <div className="hover-bottom-row">
            <span className="behance-category-tag">
              #{projectCategory.replace(/\s+/g, '')}
            </span>
            <span className="hover-view-label">Xem dự án →</span>
          </div>
        </div>
      </div>

      {/* DÒNG THÔNG TIN TỐI GIẢN PHÍA DƯỚI (MINIMAL INFO) */}
      <div className="behance-card-info-bar">
        {/* Dòng 1: Tiêu đề dự án in đậm */}
        <div className="behance-card-title-row">
          <span className="behance-card-title" title={post.title || post.content}>
            {projectTitle}
          </span>
        </div>

        {/* Dòng 2: Avatar tác giả + Tên tác giả & Chỉ số (Views, Likes) */}
        <div className="behance-card-meta-row">
          <div className="behance-creator-meta">
            <Avatar user={{ username: post.author, profile_photo_url: post.authorAvatar }} size={22} />
            <span className="behance-creator-name">{post.author}</span>
            {post.isVerified && (
              <svg className="verified-badge-icon" viewBox="0 0 24 24" width="12" height="12" fill="#0095f6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>

          <div className="behance-stats-meta">
            <span className="behance-stat-item" title={`${views} lượt xem`}>
              <Eye size={13} />
              <span>{views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}</span>
            </span>
            <button
              type="button"
              className={`behance-stat-like-btn ${post.isLiked ? 'liked' : ''}`}
              onClick={handleLikeClick}
              title={`${likes} lượt thích`}
            >
              <Heart size={13} fill={post.isLiked ? '#ef4444' : 'none'} color={post.isLiked ? '#ef4444' : 'currentColor'} />
              <span>{likes >= 1000 ? (likes / 1000).toFixed(1) + 'k' : likes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
