import React from 'react';

const BACKEND_ROOT_URL = 'https://social-media-clone-di9z.onrender.com';

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