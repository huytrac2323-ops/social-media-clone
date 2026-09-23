import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectDetailModal from '../modals/ProjectDetailModal.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import CreateCollabModal from '../modals/CreateCollabModal.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { safeFetch } from '../utils/api';
import {
  SlidersHorizontal,
  Search,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Plus,
  MessageCircle,
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES_LIST = [
  { id: 'all', label: 'Tất cả', tagClass: 'tag-all' },
  { id: 'UI/UX Design', label: 'UI/UX Design', tagClass: 'tag-uiux' },
  { id: 'Thiết kế đồ họa', label: 'Đồ họa & Thương hiệu', tagClass: 'tag-graphic' },
  { id: '3D & Hoạt hình', label: '3D & Motion', tagClass: 'tag-3dmotion' },
  { id: 'Minh họa & Art', label: 'Minh họa (Illustration)', tagClass: 'tag-illustration' },
  { id: 'Làm Video & Editor', label: 'Video & Phim', tagClass: 'tag-video' },
  { id: 'Nhiếp ảnh', label: 'Nhiếp ảnh', tagClass: 'tag-photo' },
  { id: 'Website', label: 'Website & Web App', tagClass: 'tag-web' },
  { id: 'Branding & Logo', label: 'Logo & Bộ nhận diện', tagClass: 'tag-branding' },
  { id: 'Figma', label: 'Figma', tagClass: 'tag-figma' }
];

const SCOPE_TABS = [
  { id: 'projects', label: '🎨 Tác phẩm (Projects)' },
  { id: 'creators', label: '👥 Nhà Sáng Tạo (Creators)' },
  { id: 'collaborations', label: '💼 Tin Tìm NST & Hợp Tác' }
];

const CREATOR_FIELDS = [
  { id: 'all', label: 'Tất cả lĩnh vực', tagClass: 'tag-all' },
  { id: 'UI/UX', label: 'UI/UX Design', tagClass: 'tag-uiux' },
  { id: 'designer', label: 'Đồ họa & Thương hiệu', tagClass: 'tag-graphic' },
  { id: '3D', label: '3D & Motion', tagClass: 'tag-3dmotion' },
  { id: 'illustrator', label: 'Minh họa (Illustration)', tagClass: 'tag-illustration' },
  { id: 'videographer', label: 'Làm Video', tagClass: 'tag-video' },
  { id: 'photographer', label: 'Nhiếp ảnh', tagClass: 'tag-photo' },
  { id: 'web', label: 'Lập trình & Tech', tagClass: 'tag-web' }
];

const COLLAB_CATEGORIES = [
  { id: 'all', label: 'Tất cả tin tuyển', tagClass: 'tag-all' },
  { id: 'UI/UX Design', label: 'UI/UX Design', tagClass: 'tag-uiux' },
  { id: 'Đồ họa & Thương hiệu', label: 'Đồ họa & Thương hiệu', tagClass: 'tag-graphic' },
  { id: '3D & Motion Graphics', label: '3D & Motion', tagClass: 'tag-3dmotion' },
  { id: 'Minh họa & Art', label: 'Minh họa & Art', tagClass: 'tag-illustration' },
  { id: 'Làm Video & Editor', label: 'Video & Editor', tagClass: 'tag-video' },
  { id: 'Lập trình & Tech', label: 'Lập trình & Tech', tagClass: 'tag-web' }
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeScope, setActiveScope] = useState(() => searchParams.get('tab') || 'projects');
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'latest' | 'likes' | 'views'
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);

  // States cho Nhà Sáng Tạo (Creators)
  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [creatorField, setCreatorField] = useState('all');

  // States cho Tin Tìm NST & Tuyển Dụng (Collaborations)
  const [collaborations, setCollaborations] = useState([]);
  const [collabsLoading, setCollabsLoading] = useState(false);
  const [collabCategory, setCollabCategory] = useState('all');

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['projects', 'creators', 'collaborations'].includes(tabParam)) {
      setActiveScope(tabParam);
    }
  }, [searchParams]);

  const handleSwitchScope = (scopeId) => {
    setActiveScope(scopeId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', scopeId);
      return next;
    });
  };

  // 1. TÁCH RIÊNG DỰ ÁN BEHANCE: Chỉ lấy các bài viết kiểu dự án (project) hoặc bài có title/category
  const displayedProjects = useMemo(() => {
    let result = (posts || []).filter(p => p.postType === 'project' || Boolean(p.title && p.title.trim()));

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

  // 2. TẢI DANH SÁCH NHÀ SÁNG TẠO (CREATORS)
  const loadCreators = useCallback(async () => {
    setCreatorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (creatorField !== 'all') params.append('type', creatorField);
      if (searchKeyword.trim()) params.append('q', searchKeyword.trim());
      params.append('limit', '50');

      const res = await safeFetch(`/explore/creators?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(Array.isArray(data) ? data : []);
      }
    } catch {
      setCreators([]);
    } finally {
      setCreatorsLoading(false);
    }
  }, [creatorField, searchKeyword]);

  // 3. TẢI DANH SÁCH TIN TÌM KIẾM NST & HỢP TÁC (COLLABORATIONS)
  const loadCollaborations = useCallback(async () => {
    setCollabsLoading(true);
    try {
      const params = new URLSearchParams();
      if (collabCategory !== 'all') params.append('category', collabCategory);
      if (searchKeyword.trim()) params.append('q', searchKeyword.trim());
      params.append('status', 'open');

      const res = await safeFetch(`/collaborations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCollaborations(Array.isArray(data) ? data : []);
      }
    } catch {
      setCollaborations([]);
    } finally {
      setCollabsLoading(false);
    }
  }, [collabCategory, searchKeyword]);

  useEffect(() => {
    if (activeScope === 'creators') {
      loadCreators();
    } else if (activeScope === 'collaborations') {
      loadCollaborations();
    }
  }, [activeScope, loadCreators, loadCollaborations]);

  // Helper mở chat trực tiếp với Nhà Sáng Tạo
  const handleStartChat = (targetUser, initialMessage) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const targetId = targetUser.user_id || targetUser.id;
    const targetName = targetUser.username || 'Người dùng';
    localStorage.setItem('activeChatUser', JSON.stringify({
      user_id: targetId,
      username: targetName
    }));
    window.dispatchEvent(new CustomEvent('open-chat'));
  };

  return (
    <div className="behance-page-wrapper">
      {/* 1. TOP HEADER HIỆN ĐẠI CHUẨN BEHANCE */}
      <AppHeader
        onCreatePost={() => setShowCreateModal(true)}
        onSearch={(q) => setSearchKeyword(q)}
        allUsers={allUsers}
        friendUserIds={friendUserIds}
      />

      {/* 2. SUBHEADER: BỘ LỌC, TAB PHẠM VI & SẮP XẾP */}
      <section className="behance-subheader-section">
        {/* HÀNG TRÊN: TÌM KIẾM, 3 TAB PHẠM VI CHÍNH & SẮP XẾP */}
        <div className="behance-subheader-main-row">
          {/* TAB CHUYỂN ĐỔI: DỰ ÁN / NHÀ SÁNG TẠO / TIN TÌM NST */}
          <div className="behance-scope-tabs">
            {SCOPE_TABS.map(tab => (
              <button
                type="button"
                key={tab.id}
                className={`behance-scope-btn ${activeScope === tab.id ? 'active' : ''}`}
                onClick={() => handleSwitchScope(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SẮP XẾP / NÚT HÀNH ĐỘNG PHỤ TÙY THEO TAB */}
          <div className="behance-subheader-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {activeScope === 'collaborations' ? (
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    navigate('/login');
                    return;
                  }
                  setShowCollabModal(true);
                }}
                className="btn-collab-post-new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 18px', borderRadius: '999px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: '#fff', fontSize: '13.5px', fontWeight: '700',
                  border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Đăng tin tìm NST</span>
              </button>
            ) : activeScope === 'projects' ? (
              <div className="behance-sort-dropdown-wrap">
                <span className="sort-label">Sắp xếp theo:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="behance-sort-select"
                >
                  <option value="recommended">Được đề xuất</option>
                  <option value="latest">Mới nhất</option>
                  <option value="likes">Nhiều tym nhất</option>
                  <option value="views">Lượt xem nhiều nhất</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {/* HÀNG DƯỚI: DẢI TAGS DANH MỤC THỂ LOẠI (CATEGORY PILLS) */}
        {activeScope === 'projects' && (
          <div className="behance-tags-scroll-container no-scrollbar">
            {CATEGORIES_LIST.map(cat => (
              <button
                type="button"
                key={cat.id}
                className={`behance-tag-pill ${cat.tagClass || ''} ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.id !== 'all' ? `#${cat.label}` : cat.label}
              </button>
            ))}
          </div>
        )}

        {/* BỘ LỌC CHUYÊN MÔN CHO TAB NHÀ SÁNG TẠO */}
        {activeScope === 'creators' && (
          <div className="behance-tags-scroll-container no-scrollbar">
            {CREATOR_FIELDS.map(f => (
              <button
                type="button"
                key={f.id}
                className={`behance-tag-pill ${f.tagClass || ''} ${creatorField === f.id ? 'active' : ''}`}
                onClick={() => setCreatorField(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* BỘ LỌC LĨNH VỰC CHO TAB TIN TÌM NST */}
        {activeScope === 'collaborations' && (
          <div className="behance-tags-scroll-container no-scrollbar">
            {COLLAB_CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.id}
                className={`behance-tag-pill ${cat.tagClass || ''} ${collabCategory === cat.id ? 'active' : ''}`}
                onClick={() => setCollabCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* THÔNG BÁO SỐ LƯỢNG KẾT QUẢ */}
        <div className="behance-results-meta-bar">
          <div className="results-count-text">
            {activeScope === 'projects' && (
              <span>Khám phá <strong>{displayedProjects.length}</strong> tác phẩm sáng tạo hàng đầu trên NovaGen</span>
            )}
            {activeScope === 'creators' && (
              <span>Tìm thấy <strong>{creators.length}</strong> Nhà Sáng Tạo sẵn sàng hợp tác dự án</span>
            )}
            {activeScope === 'collaborations' && (
              <span>Có <strong>{collaborations.length}</strong> cơ hội hợp tác và việc làm đang mở</span>
            )}
          </div>
        </div>
      </section>

      {/* 3. NỘI DUNG CHÍNH (THEO TAB ĐANG CHỌN) */}
      <main className="behance-fullwidth-feed-container">
        {/* ========================================================= */}
        {/* TAB 1: DANH SÁCH DỰ ÁN BEHANCE                            */}
        {/* ========================================================= */}
        {activeScope === 'projects' && (
          <div className="behance-fullwidth-grid">
            {displayedProjects && displayedProjects.length > 0 ? (
              displayedProjects.map((post, idx) => (
                <React.Fragment key={post.post_id || post.id}>
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
                        <span>Đăng tác phẩm ngay</span>
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
                <h3 className="empty-title">Chưa có tác phẩm thiết kế nào</h3>
                <p className="empty-desc">
                  Hãy là người đầu tiên đăng tải tác phẩm sáng tạo của bạn lên Showcase Explore!
                </p>
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Đăng tác phẩm đầu tiên
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DANH BẠ NHÀ SÁNG TẠO THEO LĨNH VỰC (CREATORS)      */}
        {/* ========================================================= */}
        {activeScope === 'creators' && (
          <div>
            {creatorsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Đang tải danh sách Nhà Sáng Tạo...</p>
              </div>
            ) : creators.length === 0 ? (
              <div className="behance-empty-state-card">
                <div className="empty-icon-wrap"><Users size={36} color="#60a5fa" /></div>
                <h3 className="empty-title">Không tìm thấy Nhà Sáng Tạo phù hợp</h3>
                <p className="empty-desc">Hãy thử đổi bộ lọc lĩnh vực hoặc xóa từ khóa tìm kiếm.</p>
                <button type="button" className="btn-reset-filters" onClick={() => { setCreatorField('all'); setSearchKeyword(''); }}>
                  Xem tất cả Nhà Sáng Tạo
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '18px'
              }}>
                {creators.map(c => (
                  <div
                    key={c.user_id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '22px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'transform 0.18s ease, border-color 0.18s ease',
                      boxShadow: 'var(--shadow-card)'
                    }}
                  >
                    {/* Header thông tin tác giả */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        onClick={() => navigate(`/profile/${encodeURIComponent(c.username)}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Avatar user={c} size={54} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          onClick={() => navigate(`/profile/${encodeURIComponent(c.username)}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)',
                            cursor: 'pointer', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
                          }}
                        >
                          <span>{c.username}</span>
                          {c.is_verified && (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.14)',
                          color: '#60a5fa',
                          marginTop: '3px'
                        }}>
                          {c.creator_type || 'Nhà sáng tạo đa phương tiện'}
                        </span>
                      </div>
                    </div>

                    {/* Tiểu sử / Bio */}
                    <p style={{
                      fontSize: '12.5px', color: 'var(--text-secondary)',
                      lineHeight: '1.45', minHeight: '36px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      margin: 0
                    }}>
                      {c.bio || 'Chưa cập nhật phần giới thiệu bản thân.'}
                    </p>

                    {/* Trạng thái hợp tác & Chỉ số */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '600' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
                        Đang nhận dự án
                      </span>
                      <span><strong>{c.post_count || 0}</strong> bài viết • <strong>{c.follower_count || 0}</strong> theo dõi</span>
                    </div>

                    {/* 2 Nút hành động trực tiếp */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartChat(c, 'Chào bạn, mình muốn trao đổi về cơ hội hợp tác...')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '8px', borderRadius: '9px',
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          color: '#fff', fontSize: '12px', fontWeight: '700',
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>Hợp tác ngay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${encodeURIComponent(c.username)}`)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '8px', borderRadius: '9px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Xem hồ sơ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TIN TÌM NST & CƠ HỘI HỢP TÁC (COLLABORATIONS)       */}
        {/* ========================================================= */}
        {activeScope === 'collaborations' && (
          <div>
            {collabsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <Briefcase size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Đang tải tin tuyển dụng và cơ hội hợp tác...</p>
              </div>
            ) : collaborations.length === 0 ? (
              <div className="behance-empty-state-card">
                <div className="empty-icon-wrap"><Briefcase size={36} color="#10b981" /></div>
                <h3 className="empty-title">Chưa có tin tìm kiếm Nhà Sáng Tạo nào</h3>
                <p className="empty-desc">Bạn đang cần tìm Designer, Họa sĩ hoặc Video Editor cho dự án? Hãy đăng tin ngay!</p>
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => setShowCollabModal(true)}
                >
                  + Đăng tin tìm NST ngay
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '18px'
              }}>
                {collaborations.map(job => {
                  let parsedSkills = [];
                  try {
                    parsedSkills = Array.isArray(job.skills_required) 
                      ? job.skills_required 
                      : (typeof job.skills_required === 'string' ? JSON.parse(job.skills_required || '[]') : []);
                  } catch { parsedSkills = []; }

                  return (
                    <div
                      key={job.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: 'var(--shadow-card)',
                        transition: 'border-color 0.18s ease'
                      }}
                    >
                      {/* Tiêu đề & Ngân sách */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' }}>
                            {job.category}
                          </span>
                          <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 0', lineHeight: 1.35 }}>
                            {job.title}
                          </h4>
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34d399', fontSize: '12.5px', fontWeight: '700', whiteSpace: 'nowrap'
                        }}>
                          {job.budget || 'Thỏa thuận'}
                        </span>
                      </div>

                      {/* Thông tin người đăng tin */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar user={{ username: job.username, profile_photo_url: job.profile_photo_url }} size={28} />
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          {job.username}
                        </span>
                        {job.is_verified && (
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="#0095f6">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: 'auto' }}>
                          {new Date(job.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Mô tả công việc */}
                      <p style={{
                        fontSize: '13px', color: 'var(--text-secondary)',
                        lineHeight: 1.5, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {job.description}
                      </p>

                      {/* Tags kỹ năng */}
                      {parsedSkills && parsedSkills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {parsedSkills.map(sk => (
                            <span
                              key={sk}
                              style={{
                                fontSize: '11px', fontWeight: '600',
                                padding: '2px 8px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)'
                              }}
                            >
                              #{sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Thanh hành động cuối thẻ */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '2px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          <Clock size={13} />
                          <span>Hạn: <strong>{job.deadline || 'Linh hoạt'}</strong></span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartChat(
                            { user_id: job.user_id, username: job.username },
                            `Chào bạn, mình xem tin tìm NST "${job.title}" của bạn trên NovaGen và muốn gửi báo giá / hồ sơ hợp tác!`
                          )}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '7px 16px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            color: '#fff', fontSize: '12.5px', fontWeight: '700',
                            border: 'none', cursor: 'pointer', transition: 'all 0.18s ease'
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>Ứng tuyển / Báo giá ngay</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL CHI TIẾT TÁC PHẨM TRÀN VIỀN 70/30 */}
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

      {/* MODAL ĐĂNG TÁC PHẨM / PORTFOLIO CASE STUDY */}
      {showCreateModal && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-content-create-project" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo tác phẩm & Dự án Portfolio</h2>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <CreatePost
              defaultMode="portfolio"
              onPostCreated={() => {
                if (onPostCreated) onPostCreated();
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG TIN TÌM KIẾM NHÀ SÁNG TẠO */}
      {showCollabModal && (
        <CreateCollabModal
          isOpen={showCollabModal}
          onClose={() => setShowCollabModal(false)}
          onCreated={() => {
            loadCollaborations();
          }}
        />
      )}

      {/* CHAT WIDGET TRỰC TIẾP */}
      <ChatWidget />
    </div>
  );
}
