import React, { useState } from 'react';
import './Modal.css';

// Bỏ hằng số API_URL
// const API_URL = 'http://localhost:5000';

function EditProfileModal({ user, onClose, navigate }) {
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
    let updatedUsername = user.username;

    try {
      // Sửa ở đây
      const textResponse = await fetch(`/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio }),
      });
      const textData = await textResponse.json();
      if (!textResponse.ok) throw new Error(textData.message || 'Lỗi cập nhật thông tin');
      updatedUsername = textData.username;
    } catch (err) {
      setError(err.message);
      return;
    }

    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        // Sửa ở đây
        const avatarResponse = await fetch(`/api/profile/avatar`, {
          method: 'POST',
          body: formData,
        });
        if (!avatarResponse.ok) throw new Error('Lỗi cập nhật avatar');
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    onClose();

    if (updatedUsername !== user.username) {
      navigate(`/profile/${updatedUsername}`);
    } else {
      window.location.reload();
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
              // Sửa ở đây
              src={previewAvatar || (user.profile_photo_url ? user.profile_photo_url : 'https://picsum.photos/100')}
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
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Tiểu sử</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
            />
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
