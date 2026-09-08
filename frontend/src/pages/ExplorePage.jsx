import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

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

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 20px', color: 'white' }}>
      <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>← Trang chủ</Link>
      <h1 style={{ margin: '20px 0 14px' }}>Khám phá</h1>
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Tìm người dùng, hashtag, nội dung hoặc địa điểm..."
        aria-label="Tìm kiếm"
        style={{ width: '100%', padding: '13px 16px', borderRadius: '24px', border: '1px solid #555', background: '#242526', color: 'white', fontSize: '15px' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {[
          ['all', 'Tất cả'], ['users', 'Tài khoản'], ['posts', 'Bài viết'], ['location', 'Địa điểm']
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setType(value)} style={{ padding: '7px 12px', borderRadius: 18, border: '1px solid #555', background: type === value ? '#0095f6' : '#242526', color: 'white' }}>{label}</button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: 7, borderRadius: 18 }}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>
      {type === 'location' && <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Nhập địa điểm cần lọc" style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 8 }} />}
      {loading && <p style={{ color: '#aaa', marginTop: '18px' }}>Đang tìm...</p>}
      {!loading && term.trim().length >= 2 && (
        <>
          <h2 style={{ margin: '24px 0 12px', fontSize: '18px' }}>Tài khoản</h2>
          {result.users.length === 0 ? <p style={{ color: '#aaa' }}>Không tìm thấy tài khoản.</p> : result.users.map(user => (
            <button key={user.user_id} type="button" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px', marginBottom: '8px', border: 'none', borderRadius: '8px', background: '#242526', color: 'white', textAlign: 'left', cursor: 'pointer' }}>
              <Avatar user={user} className="explore-avatar" />
              <span>{user.username}{user.is_private ? ' 🔒' : ''}</span>
            </button>
          ))}
          <h2 style={{ margin: '24px 0 12px', fontSize: '18px' }}>Bài viết</h2>
          {result.posts.length === 0 ? <p style={{ color: '#aaa' }}>Không tìm thấy bài viết.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {result.posts.map(post => (
                <button key={post.post_id} type="button" onClick={() => navigate(`/post/${post.post_id}`)} style={{ aspectRatio: '1', padding: 0, border: 'none', background: '#242526', color: 'white', cursor: 'pointer', overflow: 'hidden' }}>
                  {post.photo_url ? <img src={post.photo_url} alt={post.caption || 'Bài viết'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'block', padding: '12px', textAlign: 'left' }}>{post.caption}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default ExplorePage;
