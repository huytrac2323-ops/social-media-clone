import React from 'react';

const API_BASE_URL = 'https://social-media-clone-di9z.onrender.com/uploads';

const Avatar = ({ user, className = '' }) => {
  const imageUrl = user.profile_photo_url ? `${API_BASE_URL}${user.profile_photo_url}` : null;
  const initial = user.username ? user.username[0].toUpperCase() : '?';

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