import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import CreatePost from '../modals/CreatePost.jsx';
import {
  Search, Compass, User, FileText, MapPin, X, Sparkles, Users,
  CheckCircle2, ArrowUpDown, SlidersHorizontal, RotateCcw, Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

const CREATOR_CATEGORIES = [
  { value: 'all',          emoji: '🌟', label: 'Tất cả' },
  { value: 'illustrator',  emoji: '🎨', label: 'Họa sĩ / Minh họa' },
  { value: 'photographer', emoji: '📸', label: 'Nhiếp ảnh' },
  { value: 'musician',     emoji: '🎵', label: 'Âm nhạc' },
  { value: 'videographer', emoji: '🎬', label: 'Làm Video' },
  { value: 'writer',       emoji: '✍️',  label: 'Nhà văn / Tác giả' },
  { value: 'dancer',       emoji: '💃', label: 'Vũ công' },
  { value: 'designer',     emoji: '🖥️', label: 'Thiết kế đồ họa' },
  { value: 'gamer',        emoji: '🎮', label: 'Game Creator' },
  { value: 'crafter',      emoji: '🧶', label: 'Thủ công / DIY' },
];

const CREATOR_LABELS = {
  illustrator:  { emoji: '🎨', label: 'Họa sĩ / Minh họa' },
  photographer: { emoji: '📸', label: 'Nhiếp ảnh gia' },
  musician:     { emoji: '🎵', label: 'Nhạc sĩ / Ca sĩ' },
  videographer: { emoji: '🎬', label: 'Làm Video' },
  writer:       { emoji: '✍️',  label: 'Nhà văn / Tác giả' },
  dancer:       { emoji: '💃', label: 'Vũ công / Biên đạo' },
  designer:     { emoji: '🖥️', label: 'Thiết kế đồ họa' },
  gamer:        { emoji: '🎮', label: 'Game Creator' },
  crafter:      { emoji: '🧶', label: 'Thủ công / DIY' },
};

function ExplorePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- Tab chính: 'creators' | 'search' ---
  const [mainTab, setMainTab] = useState('creators');

  // --- Creators filter state ---
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [creatorQuery, setCreatorQuery] = useState('');
  const [creatorLocation, setCreatorLocation] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasPostsOnly, setHasPostsOnly] = useState(false);
  const [creatorSort, setCreatorSort] = useState('followers');
  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);

  // --- Search tab state ---
  const [term, setTerm] = useState('');
  const [result, setResult] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('newest');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Khởi tạo từ URL params nếu có
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q) { setTerm(q); setMainTab('search'); }
  }, [searchParams]);

  // ========== Load creators với bộ lọc nâng cao ==========
  const fetchCreators = useCallback(async () => {
    setCreatorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('type', selectedCategory);
      if (creatorQuery.trim()) params.append('q', creatorQuery.trim());
      if (creatorLocation.trim()) params.append('location', creatorLocation.trim());
      if (verifiedOnly) params.append('verified', 'true');
      if (hasPostsOnly) params.append('has_posts', 'true');
      if (creatorSort) params.append('sort', creatorSort);
      params.append('limit', '40');

      const url = `${API_URL}/explore/creators?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setCreators(await res.json());
    } catch {
      setCreators([]);
    } finally {
      setCreatorsLoading(false);
    }
  }, [selectedCategory, creatorQuery, creatorLocation, verifiedOnly, hasPostsOnly, creatorSort]);

  // Debounce tìm kiếm creators khi gõ từ khóa hoặc địa điểm
  useEffect(() => {
    if (mainTab !== 'creators') return;
    const timer = setTimeout(() => {
      fetchCreators();
    }, 280);
    return () => clearTimeout(timer);
  }, [mainTab, fetchCreators]);

  const handleResetCreatorFilters = () => {
    setSelectedCategory('all');
    setCreatorQuery('');
    setCreatorLocation('');
    setVerifiedOnly(false);
    setHasPostsOnly(false);
    setCreatorSort('followers');
  };

  const hasActiveFilters = selectedCategory !== 'all' || creatorQuery.trim() !== '' ||
    creatorLocation.trim() !== '' || verifiedOnly || hasPostsOnly || creatorSort !== 'followers';

  // ========== Search tab debounce ==========
  useEffect(() => {
    if (mainTab !== 'search') return;
    const timer = setTimeout(async () => {
      if (term.trim().length < 2) { setResult({ users: [], posts: [] }); return; }
      setLoading(true);
      try {
        const userId = currentUser?.user_id || '';
        const res = await fetch(`${API_URL}/explore/search?q=${encodeURIComponent(term)}&userId=${userId}&type=${type}&location=${encodeURIComponent(location)}&sort=${sort}`);
        if (!res.ok) throw new Error();
        setResult(await res.json());
      } catch {
        setResult({ users: [], posts: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, type, location, sort, currentUser, mainTab]);

  const filterTabs = [
    { value: 'all', label: 'Tất cả', icon: Compass },
    { value: 'users', label: 'Tài khoản', icon: User },
    { value: 'posts', label: 'Bài viết', icon: FileText },
    { value: 'location', label: 'Địa điểm', icon: MapPin },
  ];

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main style={{ flex: 1, maxWidth: '840px', minWidth: 0, paddingBottom: '80px' }}>

          {/* ========== MAIN TAB SWITCHER ========== */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px',
          }}>
            <button
              type="button"
              onClick={() => setMainTab('creators')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: mainTab === 'creators' ? 'var(--accent-primary)' : 'transparent',
                color: mainTab === 'creators' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={16} />
              Khám Phá Nhà Sáng Tạo
            </button>
            <button
              type="button"
              onClick={() => setMainTab('search')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: mainTab === 'search' ? 'var(--accent-primary)' : 'transparent',
                color: mainTab === 'search' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Search size={16} />
              Tìm Kiếm Nội Dung
            </button>
          </div>

          {/* ========== TAB: NHÀ SÁNG TẠO (BỘ LỌC NÂNG CAO) ========== */}
          {mainTab === 'creators' && (
            <div>
              {/* Header Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(168,85,247,0.14) 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 20px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <h1 style={{ fontSize: '23px', fontWeight: '800', marginBottom: '6px', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  🎨 Mạng Lưới Nhà Sáng Tạo NovaGen
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '520px', margin: '0 auto' }}>
                  Khám phá tác giả tài năng, lọc theo ngành nghề, khu vực địa lý hoặc mức độ tương tác.
                </p>
              </div>

              {/* BỘ LỌC TÌM KIẾM NÂNG CAO */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-card)'
              }}>
                {/* 2 Input: Tìm theo tên/từ khóa + Tìm theo địa chỉ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={creatorQuery}
                      onChange={e => setCreatorQuery(e.target.value)}
                      placeholder="Tìm tên, tiểu sử, sở thích..."
                      style={{
                        width: '100%', padding: '10px 32px 10px 36px',
                        borderRadius: '10px', border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)', color: 'var(--text-primary)',
                        fontSize: '13.5px', outline: 'none'
                      }}
                    />
                    {creatorQuery && (
                      <button
                        type="button"
                        onClick={() => setCreatorQuery('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
                    <input
                      type="text"
                      value={creatorLocation}
                      onChange={e => setCreatorLocation(e.target.value)}
                      placeholder="Lọc theo nơi ở, quê quán (Hà Nội, TP.HCM...)"
                      style={{
                        width: '100%', padding: '10px 32px 10px 36px',
                        borderRadius: '10px', border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)', color: 'var(--text-primary)',
                        fontSize: '13.5px', outline: 'none'
                      }}
                    />
                    {creatorLocation && (
                      <button
                        type="button"
                        onClick={() => setCreatorLocation('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hàng nút lọc phụ & Sắp xếp */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {/* Toggle Verified */}
                    <button
                      type="button"
                      onClick={() => setVerifiedOnly(!verifiedOnly)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px',
                        border: `1px solid ${verifiedOnly ? '#3b82f6' : 'var(--border-subtle)'}`,
                        background: verifiedOnly ? 'rgba(59,130,246,0.18)' : 'var(--bg-elevated)',
                        color: verifiedOnly ? '#60a5fa' : 'var(--text-secondary)',
                        fontSize: '12.5px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={14} color={verifiedOnly ? '#3b82f6' : 'currentColor'} />
                      <span>Có tích xanh</span>
                    </button>

                    {/* Toggle Has Posts */}
                    <button
                      type="button"
                      onClick={() => setHasPostsOnly(!hasPostsOnly)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px',
                        border: `1px solid ${hasPostsOnly ? '#3b82f6' : 'var(--border-subtle)'}`,
                        background: hasPostsOnly ? 'rgba(59,130,246,0.18)' : 'var(--bg-elevated)',
                        color: hasPostsOnly ? '#60a5fa' : 'var(--text-secondary)',
                        fontSize: '12.5px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      <FileText size={14} />
                      <span>Đã có bài viết</span>
                    </button>

                    {/* Reset button */}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetCreatorFilters}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '6px 10px', borderRadius: '8px',
                          border: '1px dashed var(--border-light)',
                          background: 'transparent', color: '#f87171',
                          fontSize: '12px', fontWeight: '500', cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Xóa bộ lọc</span>
                      </button>
                    )}
                  </div>

                  {/* Dropdown Sắp xếp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={creatorSort}
                      onChange={e => setCreatorSort(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="followers">🌟 Nhiều follower nhất</option>
                      <option value="posts">📝 Nhiều bài viết nhất</option>
                      <option value="newest">🕒 Mới tham gia nhất</option>
                      <option value="name">🔤 Tên từ A → Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category filter pills - cuộn ngang mượt mà */}
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px',
                marginBottom: '16px', scrollbarWidth: 'none',
              }}>
                {CREATOR_CATEGORIES.map(({ value, emoji, label }) => {
                  const isActive = selectedCategory === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedCategory(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: `1.5px solid ${isActive ? '#3b82f6' : 'var(--border-subtle)'}`,
                        background: isActive ? 'rgba(59,130,246,0.18)' : 'var(--bg-card)',
                        color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                        fontWeight: isActive ? '700' : '500',
                        fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.25)' : 'none'
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Kết quả tìm kiếm / Header thống kê */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {creatorsLoading ? 'Đang tìm kiếm...' : `Tìm thấy ${creators.length} nhà sáng tạo phù hợp`}
                </span>
              </div>

              {/* Creators Grid */}
              {creatorsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Đang tìm kiếm nhà sáng tạo...</p>
                </div>
              ) : creators.length === 0 ? (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '60px 20px', textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>🔍</span>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Không tìm thấy nhà sáng tạo phù hợp</p>
                  <p style={{ fontSize: '13px', marginTop: '6px', maxWidth: '400px', margin: '6px auto 16px' }}>
                    Thử đổi từ khóa, xóa bớt bộ lọc địa chỉ hoặc chọn danh mục khác nhé!
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetCreatorFilters}
                      style={{
                        padding: '8px 18px', borderRadius: '8px',
                        background: 'var(--accent-primary)', color: 'white',
                        fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      Đặt lại toàn bộ bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '14px'
                }}>
                  {creators.map(creator => {
                    const ctInfo = CREATOR_LABELS[creator.creator_type] || null;
                    return (
                      <div
                        key={creator.user_id}
                        onClick={() => navigate(`/profile/${encodeURIComponent(creator.username)}`)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '22px 18px', gap: '10px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        {/* Badge ngành */}
                        {ctInfo && (
                          <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            background: 'rgba(59,130,246,0.15)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '20px',
                            padding: '3px 8px',
                            fontSize: '11px', color: '#60a5fa', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '3px'
                          }}>
                            <span>{ctInfo.emoji}</span>
                            <span>{ctInfo.label}</span>
                          </div>
                        )}

                        {/* Avatar */}
                        <div style={{ position: 'relative', marginTop: '6px' }}>
                          <Avatar user={creator} size={76} />
                          {creator.is_verified && (
                            <div style={{
                              position: 'absolute', bottom: '0', right: '0',
                              width: '22px', height: '22px', borderRadius: '50%',
                              background: '#3b82f6', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', border: '2px solid var(--bg-card)'
                            }} title="Đã xác minh">✓</div>
                          )}
                        </div>

                        {/* Name & username */}
                        <div style={{ width: '100%' }}>
                          <div style={{
                            fontWeight: '700', fontSize: '15.5px', color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                          }}>
                            <span>{creator.username}</span>
                          </div>

                          {/* Địa chỉ / Quê quán */}
                          {(creator.address || creator.hometown) && (
                            <div style={{
                              fontSize: '11.5px', color: 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: '3px', marginTop: '3px'
                            }}>
                              <MapPin size={12} color="#38bdf8" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {creator.address || creator.hometown}
                              </span>
                            </div>
                          )}

                          {/* Bio trích đoạn */}
                          {creator.bio && (
                            <div style={{
                              fontSize: '12px', color: 'var(--text-secondary)',
                              marginTop: '6px',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', lineHeight: '1.4'
                            }}>
                              {creator.bio}
                            </div>
                          )}

                          {/* Sở thích / Tags */}
                          {creator.interests && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '6px' }}>
                              {creator.interests.split(',').slice(0, 2).map((item, idx) => (
                                <span key={idx} style={{
                                  fontSize: '10.5px', padding: '1px 7px', borderRadius: '6px',
                                  background: 'var(--bg-elevated)', color: 'var(--text-muted)'
                                }}>
                                  #{item.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div style={{
                          display: 'flex', justifyContent: 'center', gap: '16px',
                          fontSize: '12px', color: 'var(--text-muted)',
                          padding: '8px 0', borderTop: '1px solid var(--border-subtle)',
                          width: '100%', marginTop: 'auto'
                        }}>
                          <span><strong style={{ color: 'var(--text-primary)' }}>{Number(creator.follower_count || 0).toLocaleString()}</strong> người theo dõi</span>
                          <span><strong style={{ color: 'var(--text-primary)' }}>{Number(creator.post_count || 0).toLocaleString()}</strong> bài</span>
                        </div>

                        {/* Nút Xem trang cá nhân */}
                        <div style={{
                          width: '100%', padding: '9px',
                          borderRadius: '10px',
                          background: 'rgba(59,130,246,0.12)',
                          color: '#60a5fa', fontWeight: '600', fontSize: '13px',
                          transition: 'background 0.15s ease'
                        }}>
                          Xem trang cá nhân
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== TAB: TÌM KIẾM NỘI DUNG ========== */}
          {mainTab === 'search' && (
            <div>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px',
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={20} color="#60a5fa" /> Tìm kiếm nội dung
                </h2>

                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Tìm tài khoản, hashtag, bài viết..."
                    style={{
                      width: '100%', padding: '11px 40px 11px 42px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)', color: 'var(--text-primary)',
                      fontSize: '14px', outline: 'none',
                    }}
                  />
                  {term && (
                    <button
                      type="button"
                      onClick={() => setTerm('')}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Location Filter */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lọc theo vị trí (Hà Nội, TP.HCM...)"
                    style={{
                      width: '100%', padding: '9px 14px 9px 38px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)', color: 'var(--text-primary)',
                      fontSize: '13px', outline: 'none',
                    }}
                  />
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {filterTabs.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', borderRadius: 'var(--radius-full)',
                        border: `1px solid ${type === value ? '#3b82f6' : 'var(--border-subtle)'}`,
                        background: type === value ? 'rgba(59,130,246,0.18)' : 'var(--bg-elevated)',
                        color: type === value ? '#60a5fa' : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{
                      marginLeft: 'auto', padding: '7px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                      fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="popular">Phổ biến nhất</option>
                  </select>
                </div>
              </div>

              {/* Search Results */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Đang tìm kiếm...</p>
                </div>
              ) : term.trim().length < 2 ? (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '60px 20px', textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: '15px' }}>Nhập từ khóa để bắt đầu tìm kiếm</p>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Tìm theo tên người dùng, hashtag hoặc nội dung bài viết</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Users results */}
                  {result.users.length > 0 && (
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)', padding: '16px',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        TÀI KHOẢN ({result.users.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.users.map(u => (
                          <div
                            key={u.user_id}
                            onClick={() => navigate(`/profile/${encodeURIComponent(u.username)}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '10px 12px', borderRadius: '10px',
                              background: 'var(--bg-elevated)', cursor: 'pointer',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <Avatar user={u} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{u.username}</span>
                                {u.creator_type && CREATOR_LABELS[u.creator_type] && (
                                  <span style={{ fontSize: '11px', color: '#60a5fa' }}>
                                    {CREATOR_LABELS[u.creator_type].emoji}
                                  </span>
                                )}
                              </div>
                              {u.bio && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts results */}
                  {result.posts.length > 0 && (
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)', padding: '16px',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        BÀI VIẾT ({result.posts.length})
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '10px'
                      }}>
                        {result.posts.map(post => (
                          <div
                            key={post.post_id}
                            onClick={() => navigate(`/profile/${encodeURIComponent(post.username)}`)}
                            style={{
                              borderRadius: '10px', overflow: 'hidden',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                            }}
                          >
                            {post.photo_url && (
                              <img
                                src={post.photo_url}
                                alt=""
                                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                              />
                            )}
                            <div style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                @{post.username}
                              </div>
                              <div style={{
                                fontSize: '11.5px', color: 'var(--text-muted)',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              }}>
                                {post.caption}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.users.length === 0 && result.posts.length === 0 && (
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)', padding: '48px 20px', textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <p>Không tìm thấy kết quả nào cho "{term}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>

        <ChatWidget />
      </div>

      {showCreatePost && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo bài viết mới</h2>
              <button type="button" className="close-btn" onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </button>
            </div>
            <CreatePost onPostCreated={() => setShowCreatePost(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
