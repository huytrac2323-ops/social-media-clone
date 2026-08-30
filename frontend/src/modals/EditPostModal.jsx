import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Modal.css';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;


function EditPostModal({ post, onClose, onPostUpdated }) {
  const { currentUser } = useAuth();
  const [caption, setCaption] = useState(post.content);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }

    try {
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
        onPostUpdated(); // Gọi callback để làm mới dữ liệu
      }
      onClose(); // Đóng modal

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Chỉnh sửa bài viết</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="caption">Nội dung</label>
            <textarea 
              id="caption" 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)} 
              rows="5" 
            />
          </div>
          {post.imageUrl && (
            <div className="form-group">
                <label>Ảnh hiện tại</label>
                <img src={post.imageUrl} alt="Post content" style={{ width: '100%', borderRadius: '8px' }}/>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <div className="modal-footer">
            <button type="submit" className="btn-save">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPostModal;