import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import ChatWidget from '../components/ChatWidget/ChatWidget';
import CreatePost from '../modals/CreatePost.jsx';
import { Search, Compass, User, FileText, MapPin, Lock, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function ExplorePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState('');
  const [result, setResult] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('newest');
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    setTerm(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (term.trim().length < 2) {
        setResult({ users: [], posts: [] });
        return;
      }
      setLoading(true);
      try {
        const userId = currentUser?.user_id || '';
        const response = await fetch(`${API_URL}/explore/search?q=${encodeURIComponent(term)}&userId=${userId}&type=${type}&location=${encodeURIComponent(location)}&sort=${sort}`);
        if (!response.ok) throw new Error('Không thể tìm kiếm.');
        setResult(await response.json());
      } catch (error) {
        console.error(error);
        setResult({ users: [], posts: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, type, location, sort, currentUser]);

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

        <main style={{ flex: 1, maxWidth: '780px', minWidth: 0, paddingBottom: '80px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={24} color="#60a5fa" />
              Khám phá nội dung
            </h1>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Tìm kiếm tài khoản, hashtag, bài viết..."
                aria-label="Tìm kiếm"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 44px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '14.5px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = 'var(--bg-input-focus)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-subtle)';
                  e.target.style.background = 'var(--bg-input)';
                }}
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {filterTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: type === value ? '#3b82f6' : 'var(--border-subtle)',
                    background: type === value ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
                    color: type === value ? '#60a5fa' : 'var(--text-secondary)',
                    fontWeight: type === value ? '600' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}

              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  marginLeft: 'auto',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>

            {type === 'location' && (
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Nhập địa điểm để lọc..."
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
              />
            )}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              Đang tìm kiếm dữ liệu...
            </div>
          )}

          {!loading && term.trim().length >= 2 && (
            <div>
              {/* USERS RESULTS */}
              {(type === 'all' || type === 'users') && (
                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Tài khoản ({result.users.length})
                  </h2>
                  {result.users.length === 0 ? (
                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Không tìm thấy tài khoản phù hợp.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {result.users.map(user => (
                        <button
                          key={user.user_id}
                          type="button"
                          onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <Avatar user={user} size={40} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{user.username}</span>
                              {user.is_private && <Lock size={12} color="#94a3b8" />}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.username}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* POSTS RESULTS */}
              {(type === 'all' || type === 'posts' || type === 'location') && (
                <section>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Bài viết ({result.posts.length})
                  </h2>
                  {result.posts.length === 0 ? (
                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Không tìm thấy bài viết nào.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {result.posts.map(post => (
                        <button
                          key={post.post_id}
                          type="button"
                          onClick={() => navigate(`/post/${post.post_id}`)}
                          style={{
                            aspectRatio: '1',
                            padding: 0,
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            background: 'var(--bg-card)',
                            color: 'white',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          {post.photo_url ? (
                            <img
                              src={post.photo_url}
                              alt={post.caption || 'Bài viết'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ display: 'block', padding: '16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {post.caption}
                            </span>
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
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <Compass size={48} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <p style={{ fontSize: '15px', fontWeight: '600' }}>Khám phá bài viết và tài khoản mới</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Nhập từ khóa vào ô tìm kiếm ở trên để bắt đầu.</p>
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
