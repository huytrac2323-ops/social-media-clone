import React, { useState } from 'react';
import './Modal.css';

const API_URL = 'http://localhost:5000/api';

function EditProfileModal({ user, onClose, navigate, setCurrentUser }) { // Nhận setCurrentUser
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let finalUserData = null;

    try {
      // --- Cập nhật thông tin text (username, bio) ---
      const textResponse = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio, user_id: user.user_id }),
      });
      const textData = await textResponse.json();
      if (!textResponse.ok) throw new Error(textData.message || 'Lỗi cập nhật thông tin');
      
      // Lưu trữ dữ liệu người dùng đã cập nhật từ phản hồi
      finalUserData = textData.user;

      // --- Cập nhật avatar nếu có ---
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('user_id', user.user_id);
        
        const avatarResponse = await fetch(`${API_URL}/profile/avatar`, {
          method: 'POST',
          body: formData,
        });
        
        const avatarData = await avatarResponse.json();
        if (!avatarResponse.ok) throw new Error(avatarData.message || 'Lỗi cập nhật avatar');

        // Cập nhật URL ảnh đại diện trong dữ liệu người dùng cuối cùng
        finalUserData.profile_photo_url = avatarData.profile_photo_url;
      }

      // --- Cập nhật state và điều hướng ---
      setCurrentUser(finalUserData); // Cập nhật state ở App.jsx
      onClose(); // Đóng modal

      // Điều hướng nếu username thay đổi
      if (finalUserData.username !== user.username) {
        navigate(`/profile/${finalUserData.username}`);
      } else {
        // Không cần reload, vì state đã được cập nhật và component sẽ re-render
        // Nếu cần fetch lại dữ liệu profile, có thể truyền thêm một hàm refresh
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Chỉnh sửa trang cá nhân</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group avatar-group">
            <img
              src={previewAvatar || (user.profile_photo_url ? `http://localhost:5000${user.profile_photo_url}` : 'https://picsum.photos/100')}
              alt="Avatar"
              className="modal-avatar-preview"
            />
            <label htmlFor="avatar-upload" className="btn-change-avatar">
              Đổi ảnh đại diện
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Tên người dùng</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Tiểu sử</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="3" />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-footer">
            <button type="submit" className="btn-save">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;