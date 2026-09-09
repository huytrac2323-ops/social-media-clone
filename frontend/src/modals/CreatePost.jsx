import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { Image, MapPin, X, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

function CreatePost({ onPostCreated }) {
  const { currentUser } = useAuth();
  const [inputText, setInputText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để đăng bài.');
      return;
    }
    if (!inputText.trim() && !imageFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('caption', inputText);
    formData.append('user_id', currentUser.user_id);
    if (location.trim()) formData.append('location', location.trim());
    if (imageFile) {
      formData.append('postImage', imageFile);
    }

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi đăng bài');
      }

      // Reset form
      setInputText("");
      setLocation("");
      setShowLocationInput(false);
      handleRemoveImage();

      // Callback để component cha có thể làm mới dữ liệu
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      alert(`Đăng bài thất bại!\n\nLỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="create-post-card" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
        <Avatar user={currentUser} size={42} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
            {currentUser.username}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Chia sẻ với mọi người
          </div>
        </div>
      </div>

      <form onSubmit={handlePostSubmit}>
        <textarea
          placeholder={`Bạn đang nghĩ gì thế, ${currentUser.username}?`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 14px',
            color: 'var(--text-primary)',
            fontSize: '14.5px',
            outline: 'none',
            resize: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />

        {showLocationInput && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <MapPin size={16} color="#3b82f6" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Thêm địa điểm..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        )}

        {previewUrl && (
          <div style={{ position: 'relative', marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', maxHeight: '320px', background: '#07090d', display: 'flex', justifyContent: 'center' }}>
            <img src={previewUrl} alt="Xem trước" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }} />
            <button
              type="button"
              onClick={handleRemoveImage}
              aria-label="Xóa ảnh"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <Image size={16} />
              <span>Ảnh/Video</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLocationInput(!showLocationInput)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showLocationInput ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
                color: showLocationInput ? '#34d399' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <MapPin size={16} />
              <span>Vị trí</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!inputText.trim() && !imageFile)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: (!inputText.trim() && !imageFile) ? 'var(--bg-elevated)' : 'var(--accent-gradient)',
              color: (!inputText.trim() && !imageFile) ? 'var(--text-muted)' : 'white',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: (!inputText.trim() && !imageFile) ? 'not-allowed' : 'pointer',
              boxShadow: (!inputText.trim() && !imageFile) ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Đang đăng...' : 'Đăng bài'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;