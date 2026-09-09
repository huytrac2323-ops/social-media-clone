import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Modal.css';
import { X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function EditPostModal({ post, onClose, onPostUpdated }) {
  const { currentUser } = useAuth();
  const [caption, setCaption] = useState(post?.content || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, user_id: currentUser.user_id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật bài viết thất bại.');
      }

      if (onPostUpdated) {
        onPostUpdated();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh sửa bài viết</h2>
          <button type="button" onClick={onClose} className="close-btn" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="caption">Nội dung bài viết</label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>
          {post?.imageUrl && (
            <div className="form-group">
              <label>Hình ảnh đính kèm</label>
              <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '240px', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={post.imageUrl}
                  alt="Nội dung bài viết"
                  style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }}
                />
              </div>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 18px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13.5px'
              }}
            >
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPostModal;