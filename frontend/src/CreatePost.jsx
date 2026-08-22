import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:5000/api';

function CreatePost({ onPostCreated }) {
  const { currentUser } = useAuth();
  const [inputText, setInputText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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

    const formData = new FormData();
    formData.append('caption', inputText);
    formData.append('user_id', currentUser.user_id);
    if (imageFile) {
      formData.append('postImage', imageFile);
    }

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Lỗi khi đăng bài');
      }
      
      // Reset form
      setInputText("");
      handleRemoveImage();

      // Callback để component cha có thể làm mới dữ liệu
      if (onPostCreated) {
        onPostCreated();
      }

    } catch (error) {
      alert(`Đăng bài thất bại!\n\nLỗi: ${error.message}`);
    }
  };

  if (!currentUser) {
    return null; // Không hiển thị form nếu chưa đăng nhập
  }

  return (
    <div className="create-post">
      <form onSubmit={handlePostSubmit}>
        <textarea
          placeholder={`Bạn đang nghĩ gì thế, ${currentUser.username}?`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Xem trước" />
            <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
              ✕
            </button>
          </div>
        )}
        <hr />
        <div className="create-post-actions">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button type="button" className="btn-add-photo" onClick={() => fileInputRef.current.click()}>
            📷 Thêm ảnh
          </button>
          <button type="submit" className="btn-post">
            Đăng bài
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;