import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectDetailModal from '../modals/ProjectDetailModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SlidersHorizontal,
  Search,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const CATEGORIES_LIST = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Website', label: 'Website' },
  { id: 'UI/UX Design', label: 'UI/UX' },
  { id: 'Landing Page', label: 'Landing Page' },
  { id: 'Figma', label: 'Figma' },
  { id: 'Thiết kế đồ họa', label: 'Đồ họa' },
  { id: 'Branding & Logo', label: 'Branding' },
  { id: '3D & Hoạt hình', label: '3D Art' },
  { id: 'Minh họa & Art', label: 'Minh họa' },
  { id: 'Nhiếp ảnh', label: 'Nhiếp ảnh' },
  { id: 'Typography', label: 'Poster & Typography' },
  { id: 'Bao bì & Nhãn hiệu', label: 'Bao bì' }
];

const SCOPE_TABS = [
  { id: 'projects', label: 'Dự án (Projects)' },
  { id: 'creators', label: 'Tác giả (People)' },
  { id: 'assets', label: 'Tài nguyên (Assets)' }
];

export default function BehanceProjectsPage({
  posts = [],
  allUsers = [],
  friendUserIds = new Set(),
  onLike,
  onCommentSubmit,
  onPostCreated,
  onPostDeleted,
  onPostUpdated
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeScope, setActiveScope] = useState('projects');
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'latest' | 'likes' | 'views'
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Lọc và sắp xếp tác phẩm theo các tiêu chí Behance
  const displayedProjects = useMemo(() => {
    let result = [...posts];

    // Lọc theo từ khóa tìm kiếm
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(p => {
        const titleMatch = p.title && p.title.toLowerCase().includes(q);
        const contentMatch = p.content && p.content.toLowerCase().includes(q);
        const authorMatch = p.author && p.author.toLowerCase().includes(q);
        const categoryMatch = p.category && p.category.toLowerCase().includes(q);
        const toolMatch = p.toolsUsed && p.toolsUsed.some(t => t.toLowerCase().includes(q));
        return titleMatch || contentMatch || authorMatch || categoryMatch || toolMatch;
      });
    }

    // Lọc theo thể loại
    if (activeCategory !== 'all') {
      const catLower = activeCategory.toLowerCase();
      result = result.filter(p => {
        const categoryMatch = p.category && p.category.toLowerCase().includes(catLower);
        const toolMatch = p.toolsUsed && p.toolsUsed.some(t => t.toLowerCase().includes(catLower));
        const titleMatch = p.title && p.title.toLowerCase().includes(catLower);
        return categoryMatch || toolMatch || titleMatch;
      });
    }

    // Sắp xếp
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    } else if (sortBy === 'likes') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else {
      // 'recommended': kết hợp cả lượt xem, lượt like và thời gian mới
      result.sort((a, b) => {
        const scoreA = (a.likes || 0) * 3 + (a.viewsCount || 0);
        const scoreB = (b.likes || 0) * 3 + (b.viewsCount || 0);
        return scoreB - scoreA;
      });
    }

    return result;
  }, [posts, searchKeyword, activeCategory, sortBy]);

  return (
    <div className="behance-page-wrapper">
      {/* 1. TOP HEADER HIỆN ĐẠI CHUẨN BEHANCE */}
      <AppHeader
        onCreatePost={() => setShowCreateModal(true)}
        onSearch={(q) => setSearchKeyword(q)}
        allUsers={allUsers}
        friendUserIds={friendUserIds}
      />

      {/* 2. SUBHEADER: BỘ LỌC, TÌM KIẾM TỪ KHÓA, TAB & SẮP XẾP */}
      <section className="behance-subheader-section">
        <div className="behance-subheader-main-row">
          {/* Nút Bộ lọc (Filter) */}
          <button
            type="button"
            className={`btn-behance-filter-toggle ${showFilterPanel ? 'active' : ''}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
          </button>

          {/* Ô tìm kiếm từ khóa với tag chip & nút xóa */}
          <div className="behance-search-field-box">
            <Search size={17} className="behance-search-field-icon" />
            {activeCategory !== 'all' && (
              <span className="search-active-chip">
                <span>#{activeCategory}</span>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  aria-label="Bỏ chọn danh mục"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm tác phẩm, phong cách, màu sắc, từ khóa..."
              className="behance-search-field-input"
            />
            {searchKeyword && (
              <button
                type="button"
                className="btn-clear-search-field"
                onClick={() => setSearchKeyword('')}
                aria-label="Xóa từ khóa"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Các tab phạm vi tìm kiếm (Projects, People, Assets) */}
          <div className="behance-scope-tabs">
            {SCOPE_TABS.map(tab => (
              <button
                type="button"
                key={tab.id}
                className={`behance-scope-btn ${activeScope === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveScope(tab.id);
                  if (tab.id === 'creators') navigate('/explore');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dropdown sắp xếp (Recommended, Mới nhất, v.v.) */}
          <div className="behance-sort-dropdown-wrap">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="behance-sort-select"
            >
              <option value="recommended">Được đề xuất (Recommended)</option>
              <option value="latest">Mới nhất (Latest)</option>
              <option value="likes">Nhiều yêu thích nhất (Most Liked)</option>
              <option value="views">Nhiều lượt xem nhất (Most Viewed)</option>
            </select>
          </div>
        </div>

        {/* HÀNG DƯỚI: DẢI TAGS THỂ LOẠI CUỘN NGANG MƯỢT MÀ */}
        <div className="behance-tags-scroll-container no-scrollbar">
          {CATEGORIES_LIST.map(cat => (
            <button
              type="button"
              key={cat.id}
              className={`behance-tag-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.id !== 'all' ? `#${cat.label}` : cat.label}
            </button>
          ))}
        </div>

        {/* THÔNG BÁO SỐ LƯỢNG KẾT QUẢ */}
        <div className="behance-results-meta-bar">
          <div className="results-count-text">
            {searchKeyword ? (
              <span>
                Tìm thấy <strong>{displayedProjects.length}</strong> tác phẩm cho từ khóa "{searchKeyword}"
              </span>
            ) : (
              <span>
                Khám phá <strong>{displayedProjects.length}</strong> tác phẩm sáng tạo hàng đầu trên NovaGen
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. LƯỚI TÁC PHẨM TRÀN VIỀN TOÀN MÀN HÌNH (FULL-WIDTH 4-5 CỘT) */}
      <main className="behance-fullwidth-feed-container">
        <div className="behance-fullwidth-grid">
          {displayedProjects && displayedProjects.length > 0 ? (
            displayedProjects.map((post, idx) => (
              <React.Fragment key={post.post_id || post.id}>
                {/* Xen kẽ thẻ Spotlight quảng bá sáng tạo sau mỗi 8 tác phẩm (như thẻ Adobe Express trong ảnh) */}
                {idx === 2 && !searchKeyword && (
                  <div className="behance-spotlight-card">
                    <div className="spotlight-badge">
                      <Sparkles size={14} />
                      <span>NOVA CREATIVE SPOTLIGHT</span>
                    </div>
                    <h3 className="spotlight-title">Nâng tầm Portfolio của bạn với NovaGen Pro</h3>
                    <p className="spotlight-desc">
                      Tạo bộ nhận diện chuyên nghiệp, xuất bản case study độ phân giải cao và kết nối trực tiếp với hàng nghìn khách hàng tiềm năng.
                    </p>
                    <button
                      type="button"
                      className="spotlight-cta-btn"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <span>Đăng dự án ngay</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                <ProjectCard
                  post={post}
                  onOpenModal={(p) => setSelectedProject(p)}
                  onLike={onLike}
                />
              </React.Fragment>
            ))
          ) : (
            <div className="behance-empty-state-card">
              <div className="empty-icon-wrap">
                <Layers size={36} color="#3b82f6" />
              </div>
              <h3 className="empty-title">Không tìm thấy tác phẩm nào phù hợp</h3>
              <p className="empty-desc">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác để khám phá thêm nhiều dự án độc đáo!
              </p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={() => {
                  setSearchKeyword('');
                  setActiveCategory('all');
                }}
              >
                Xóa bộ lọc & Xem tất cả
              </button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL XEM CHI TIẾT TÁC PHẨM TRÀN VIỀN (70% - 30%) */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onLike={(postId) => {
            if (onLike) onLike(postId);
            setSelectedProject(prev => prev ? {
              ...prev,
              isLiked: !prev.isLiked,
              likes: prev.isLiked ? Math.max(0, (prev.likes || 1) - 1) : (prev.likes || 0) + 1
            } : null);
          }}
          onCommentSubmit={(postId, text) => {
            if (onCommentSubmit) onCommentSubmit(postId, text);
            setSelectedProject(prev => prev ? {
              ...prev,
              comments: [
                ...(prev.comments || []),
                {
                  comment_id: 'temp-' + Date.now(),
                  comment_text: text,
                  created_at: new Date().toISOString(),
                  user_id: currentUser?.user_id,
                  username: currentUser?.username,
                  profile_photo_url: currentUser?.profile_photo_url,
                  is_verified: currentUser?.is_verified
                }
              ]
            } : null);
          }}
        />
      )}

      {/* MODAL TẠO BÀI VIẾT / ĐĂNG DỰ ÁN */}
      {showCreateModal && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo tác phẩm & Bài viết mới</h2>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <CreatePost
              onPostCreated={() => {
                if (onPostCreated) onPostCreated();
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* CHAT WIDGET TRỰC TIẾP */}
      <ChatWidget />
    </div>
  );
}
