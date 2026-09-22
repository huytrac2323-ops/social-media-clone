import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import CreatePost from '../modals/CreatePost.jsx';
import { Search, Compass, User, FileText, MapPin, X, Sparkles, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

const CREATOR_CATEGORIES = [
  { value: 'all',          emoji: '🌟', label: 'Tất cả' },
  { value: 'illustrator',  emoji: '🎨', label: 'Họa sĩ' },
  { value: 'photographer', emoji: '📸', label: 'Nhiếp ảnh' },
  { value: 'musician',     emoji: '🎵', label: 'Âm nhạc' },
  { value: 'videographer', emoji: '🎬', label: 'Video' },
  { value: 'writer',       emoji: '✍️',  label: 'Nhà văn' },
  { value: 'dancer',       emoji: '💃', label: 'Vũ công' },
  { value: 'designer',     emoji: '🖥️', label: 'Thiết kế' },
  { value: 'gamer',        emoji: '🎮', label: 'Gamer' },
  { value: 'crafter',      emoji: '🧶', label: 'Thủ công' },
];

const CREATOR_LABELS = {
  illustrator:  { emoji: '🎨', label: 'Họa sĩ' },
  photographer: { emoji: '📸', label: 'Nhiếp ảnh' },
  musician:     { emoji: '🎵', label: 'Âm nhạc' },
  videographer: { emoji: '🎬', label: 'Làm Video' },
  writer:       { emoji: '✍️',  label: 'Nhà văn' },
  dancer:       { emoji: '💃', label: 'Vũ công' },
  designer:     { emoji: '🖥️', label: 'Thiết kế' },
  gamer:        { emoji: '🎮', label: 'Gamer' },
  crafter:      { emoji: '🧶', label: 'Thủ công' },
};

function ExplorePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- Tab chính: 'creators' | 'search' ---
  const [mainTab, setMainTab] = useState('creators');

  // --- Creators state ---
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);

  // --- Search state ---
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

  // ========== Load creators theo danh mục ==========
  const fetchCreators = useCallback(async (category) => {
    setCreatorsLoading(true);
    try {
      const url = `${API_URL}/explore/creators?type=${category}&limit=24`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setCreators(await res.json());
    } catch {
      setCreators([]);
    } finally {
      setCreatorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === 'creators') fetchCreators(selectedCategory);
  }, [mainTab, selectedCategory, fetchCreators]);

  // ========== Search debounce ==========
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

        <main style={{ flex: 1, maxWidth: '800px', minWidth: 0, paddingBottom: '80px' }}>

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
              Nhà Sáng Tạo
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
              Tìm Kiếm
            </button>
          </div>

          {/* ========== TAB: NHÀ SÁNG TẠO ========== */}
          {mainTab === 'creators' && (
            <div>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
                  🎨 Khám phá Nhà Sáng Tạo
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Tìm kiếm và kết nối với các nghệ sĩ, nhiếp ảnh gia, nhạc sĩ... đang hoạt động trên NovaGen
                </p>
              </div>

              {/* Category filter pills - cuộn ngang */}
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
                marginBottom: '16px',
                scrollbarWidth: 'none',
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
                        padding: '9px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: `2px solid ${isActive ? '#3b82f6' : 'var(--border-subtle)'}`,
                        background: isActive ? 'rgba(59,130,246,0.18)' : 'var(--bg-card)',
                        color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                        fontWeight: isActive ? '700' : '500',
                        fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Creators Grid */}
              {creatorsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Đang tải danh sách nhà sáng tạo...</p>
                </div>
              ) : creators.length === 0 ? (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '60px 20px', textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>
                    {CREATOR_CATEGORIES.find(c => c.value === selectedCategory)?.emoji || '🎨'}
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>Chưa có nhà sáng tạo nào trong ngành này</p>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>
                    Hãy là người đầu tiên! Cập nhật ngành nghề của bạn trong phần chỉnh sửa hồ sơ.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px'
                }}>
                  {creators.map(creator => {
                    const ctInfo = CREATOR_LABELS[creator.creator_type] || null;
                    return (
                      <button
                        key={creator.user_id}
                        type="button"
                        onClick={() => navigate(`/profile/${encodeURIComponent(creator.username)}`)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '20px 16px', gap: '10px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.18s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                      >
                        {/* Badge ngành */}
                        {ctInfo && (
                          <div style={{
                            position: 'absolute', top: '10px', right: '10px',
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
                        <div style={{ position: 'relative' }}>
                          <Avatar user={creator} size={72} />
                          {creator.is_verified && (
                            <div style={{
                              position: 'absolute', bottom: '0', right: '0',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#3b82f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', border: '2px solid var(--bg-card)'
                            }}>✓</div>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {creator.username}
                          </div>
                          {creator.bio && (
                            <div style={{
                              fontSize: '12px', color: 'var(--text-muted)',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', lineHeight: '1.4'
                            }}>
                              {creator.bio}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span><strong style={{ color: 'var(--text-primary)' }}>{Number(creator.follower_count).toLocaleString()}</strong> followers</span>
                          <span><strong style={{ color: 'var(--text-primary)' }}>{Number(creator.post_count).toLocaleString()}</strong> bài</span>
                        </div>

                        {/* Connect button */}
                        <div style={{
                          width: '100%', padding: '8px',
                          borderRadius: '10px',
                          background: 'rgba(59,130,246,0.1)',
                          color: '#60a5fa', fontWeight: '600', fontSize: '13px',
                        }}>
                          Xem trang cá nhân
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== TAB: TÌM KIẾM ========== */}
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
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; }}
                  />
                  {term && (
                    <button type="button" onClick={() => setTerm('')}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {filterTabs.map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setType(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 14px', borderRadius: 'var(--radius-full)',
                        border: '1px solid', fontSize: '13px', cursor: 'pointer',
                        borderColor: type === value ? '#3b82f6' : 'var(--border-subtle)',
                        background: type === value ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                        color: type === value ? '#60a5fa' : 'var(--text-secondary)',
                        fontWeight: type === value ? '600' : '500',
                      }}>
                      <Icon size={13} /><span>{label}</span>
                    </button>
                  ))}
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    style={{
                      marginLeft: 'auto', padding: '7px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                      fontSize: '12.5px', outline: 'none', cursor: 'pointer'
                    }}>
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                  </select>
                </div>
                {type === 'location' && (
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Nhập địa điểm..."
                    style={{ width: '100%', marginTop: '10px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                )}
              </div>

              {loading && <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>Đang tìm kiếm...</div>}

              {!loading && term.trim().length >= 2 && (
                <div>
                  {(type === 'all' || type === 'users') && (
                    <section style={{ marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                        Tài khoản ({result.users.length})
                      </h2>
                      {result.users.length === 0 ? (
                        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Không tìm thấy tài khoản nào.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                          {result.users.map(user => {
                            const ctInfo = CREATOR_LABELS[user.creator_type] || null;
                            return (
                              <button key={user.user_id} type="button"
                                onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  padding: '12px', borderRadius: '12px',
                                  border: '1px solid var(--border-subtle)',
                                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                }}>
                                <Avatar user={user} size={42} />
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{user.username}</div>
                                  {ctInfo && (
                                    <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                                      {ctInfo.emoji} {ctInfo.label}
                                    </div>
                                  )}
                                  {user.bio && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {user.bio}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  )}

                  {(type === 'all' || type === 'posts' || type === 'location') && (
                    <section>
                      <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                        Bài viết ({result.posts.length})
                      </h2>
                      {result.posts.length === 0 ? (
                        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Không tìm thấy bài viết nào.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {result.posts.map(post => (
                            <button key={post.post_id} type="button"
                              onClick={() => navigate(`/post/${post.post_id}`)}
                              style={{
                                aspectRatio: '1', padding: 0,
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px', background: 'var(--bg-card)',
                                cursor: 'pointer', overflow: 'hidden', position: 'relative'
                              }}>
                              {post.photo_url ? (
                                <img src={post.photo_url} alt={post.caption || 'Bài viết'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ display: 'block', padding: '12px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>{post.caption}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {!loading && term.trim().length < 2 && (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '60px 20px',
                  textAlign: 'center', color: 'var(--text-muted)'
                }}>
                  <Search size={44} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>Nhập từ khóa để tìm kiếm</p>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Tìm kiếm tài khoản, bài viết, hashtag hoặc địa điểm.</p>
                  <button type="button" onClick={() => setMainTab('creators')}
                    style={{
                      marginTop: '16px', padding: '10px 20px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--accent-primary)',
                      background: 'transparent', color: 'var(--accent-primary)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                    }}>
                    ← Xem Nhà Sáng Tạo
                  </button>
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
              <h2>Tạo bài viết</h2>
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
