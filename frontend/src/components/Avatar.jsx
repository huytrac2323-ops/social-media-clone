import React from 'react';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';

const gradients = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #d946ef)',
];

const Avatar = ({ user, className = '', size = 36, style = {} }) => {
  let imageUrl = null;

  if (user && user.profile_photo_url) {
    if (user.profile_photo_url.startsWith('http')) {
      imageUrl = user.profile_photo_url;
    } else {
      imageUrl = `${API_URL.replace(/\/api$/, '')}${user.profile_photo_url}`;
    }
  }

  const username = user?.username || user?.author || '?';
  const initial = username[0].toUpperCase();
  
  const charCode = username.charCodeAt(0) || 0;
  const bgGradient = gradients[charCode % gradients.length];

  const defaultStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: imageUrl ? '#1e2634' : bgGradient,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: Math.max(11, Math.floor(size * 0.42)),
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    ...style
  };

  return (
    <div className={`avatar-box ${className}`} style={defaultStyle}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export default Avatar;