import React from 'react';

// Tự động nhận diện môi trường Localhost hay Online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';

const Avatar = ({ user, className = '' }) => {
  let imageUrl = null;

  if (user && user.profile_photo_url) {
    if (user.profile_photo_url.startsWith('http')) {
      imageUrl = user.profile_photo_url;
    } else {
      imageUrl = `${BACKEND_ROOT_URL}${user.profile_photo_url}`;
    }
  }

  const initial = user && user.username ? user.username[0].toUpperCase() : '?';

  return (
      <div className={`avatar-placeholder ${className}`}>
        {imageUrl ? (
            <img src={imageUrl} alt={user.username} className="avatar-image" />
        ) : (
            <div className="avatar-initial">{initial}</div>
        )}
      </div>
  );
};

export default Avatar;