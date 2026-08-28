import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Lấy thông tin user hiện tại

// Tự động nhận diện môi trường Localhost hay Online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';
function SavePostButton({ postId, initialSavedStatus }) {
    const { currentUser } = useAuth();
    const [isSaved, setIsSaved] = useState(initialSavedStatus || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleSave = async () => {
        if (!currentUser || !currentUser.user_id) {
            alert("Vui lòng đăng nhập để lưu bài viết.");
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            return;
        }
        if (isLoading) return; // Tránh bấm liên tục (spam click)

        setIsLoading(true);
        const previousStatus = isSaved;

        // Đổi màu nút UI ngay lập tức cho mượt (Optimistic UI)
        setIsSaved(!isSaved);

        try {
            const token = localStorage.getItem('token');
            // Xác định Endpoint và Method dựa vào trạng thái
            const endpoint = isSaved ? `${API_URL}/posts/${postId}/unsave` : `${API_URL}/posts/${postId}/save`;
            const method = isSaved ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Gửi kèm user_id để Backend biết ai đang thao tác
                body: JSON.stringify({ user_id: currentUser.user_id })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Lỗi thao tác");
            }
        } catch (error) {
            // Nếu API lỗi, trả lại trạng thái cũ
            setIsSaved(previousStatus);
            console.error("Lỗi khi lưu bài viết:", error);
            alert("Không thể lưu bài viết lúc này. Vui lòng thử lại!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleSave}
            disabled={isLoading}
            style={{
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: isSaved ? '#007bff' : '#65676b',
                fontWeight: 'bold',
                fontSize: '15px'
            }}
        >
            <span>{isSaved ? '💙' : '🤍'}</span>
            {isSaved ? 'Đã lưu' : 'Lưu'}
        </button>
    );
}

export default SavePostButton;