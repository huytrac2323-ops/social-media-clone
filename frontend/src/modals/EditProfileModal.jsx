import React, { useState } from 'react';
import '../styles/Modal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Camera, Lock, Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function EditProfileModal({ user, onClose, navigate }) {
  const { updateUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTogglePrivacy = async () => {
    const newPrivacyStatus = !isPrivate;
    setIsPrivate(newPrivacyStatus);

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          is_private: newPrivacyStatus
        })
      });

      if (!response.ok) {
        setIsPrivate(!newPrivacyStatus);
        alert('Có lỗi xảy ra khi cập nhật chế độ riêng tư!');
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setIsPrivate(!newPrivacyStatus);
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
    setIsSaving(true);
    let finalUserData = null;

    try {
      const textResponse = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          user_id: user.user_id,
          is_private: isPrivate
        }),
      });
      const textData = await textResponse.json();
      if (!textResponse.ok) throw new Error(textData.message || 'Lỗi cập nhật thông tin');

      finalUserData = textData.user;

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

      updateUser(finalUserData);
      onClose();

      if (finalUserData.username !== user.username) {
        navigate(`/profile/${finalUserData.username}`);
      } else {
        window.location.reload();
      }
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
          <h2>Chỉnh sửa trang cá nhân</h2>
          <button type="button" onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Change */}
          <div className="avatar-group">
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <img
                src={previewAvatar || user.profile_photo_url || 'https://picsum.photos/100'}
                alt="Avatar"
                className="modal-avatar-preview"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={16} />
              </label>
            </div>
            <label htmlFor="avatar-upload" className="btn-change-avatar">
              Chọn ảnh mới
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
            <label htmlFor="bio">Tiểu sử cá nhân</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Chia sẻ đôi điều về bạn..."
            />
          </div>

          <div className="privacy-setting">
            <div className="privacy-header-row">
              <span className="privacy-label">Quyền riêng tư của tài khoản:</span>
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`btn-privacy ${isPrivate ? 'private-on' : 'private-off'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                <span>{isPrivate ? 'Riêng tư' : 'Công khai'}</span>
              </button>
            </div>
            <p className="privacy-desc">
              {isPrivate
                ? 'Chỉ bạn bè và người được duyệt mới có thể xem bài viết của bạn.'
                : 'Bất kỳ ai cũng có thể xem hồ sơ và các bài đăng công khai của bạn.'}
            </p>
          </div>

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

export default EditProfileModal;