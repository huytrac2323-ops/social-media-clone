import React, { useState,useEffect } from 'react';
import '../styles/Modal.css';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth

const API_URL =import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';




function EditProfileModal({ user, onClose, navigate }) { // Bỏ setCurrentUser
  const { updateUser } = useAuth(); // Lấy hàm updateUser từ context
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);


  const handleTogglePrivacy = async () => {
    setIsPrivate(!isPrivate);
    const newPrivacyStatus = !isPrivate; // Đảo ngược trạng thái hiện tại

    try {
      // Fix lỗi sai đường dẫn API (Đổi localhost thành biến API_URL)
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id, // Gửi ID người dùng lên
          is_private: newPrivacyStatus
        })
      });

      if (response.ok) {
        setIsPrivate(newPrivacyStatus);
        alert(`Đã đổi sang chế độ ${newPrivacyStatus ? 'Riêng tư' : 'Công khai'}`);
      } else {
        alert('Có lỗi xảy ra khi cập nhật!');
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };


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
      // --- Cập nhật thông tin text (username, bio, và is_private) ---
      const textResponse = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          user_id: user.user_id,
          is_private: isPrivate // 👈 Lấy trực tiếp từ state isPrivate của component
        }),
      });
      const textData = await textResponse.json();
      if (!textResponse.ok) throw new Error(textData.message || 'Lỗi cập nhật thông tin');

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

        finalUserData.profile_photo_url = avatarData.profile_photo_url;
      }

      // --- Cập nhật state và điều hướng ---
      updateUser(finalUserData);
      onClose();

      if (finalUserData.username !== user.username) {
        navigate(`/profile/${finalUserData.username}`);
      } else {
        // Load lại trang cá nhân ngay lập tức để nhận state mới
        window.location.reload();
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
                  src={previewAvatar || user.profile_photo_url || 'https://picsum.photos/100'}
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
          <div className="privacy-setting">
            <label className="privacy-label">
              Chế độ tài khoản riêng tư:
            </label>
            <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`btn-privacy ${isPrivate ? 'private-on' : 'private-off'}`}
            >
              {isPrivate ? 'Đang Bật (Private)' : 'Đang Tắt (Public)'}
            </button>
            <p className="privacy-desc">
              {isPrivate
                  ? 'Chỉ bạn bè mới có thể xem bài viết của bạn.'
                  : 'Bất kỳ ai cũng có thể xem hồ sơ và bài viết của bạn.'}
            </p>
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