import React, { useState } from 'react';

function SavePostButton({ postId, initialSavedStatus }) {
    const [isSaved, setIsSaved] = useState(initialSavedStatus || false);

    const handleToggleSave = async () => {
        // Cập nhật giao diện ngay lập tức để tạo cảm giác mượt mà (Optimistic UI)
        setIsSaved(!isSaved);

        try {
            // Giả lập gọi API (Bạn thay bằng fetch gọi đến API thực tế của Spring Boot)
            const endpoint = isSaved ? `/api/posts/${postId}/unsave` : `/api/posts/${postId}/save`;
            const method = isSaved ? 'DELETE' : 'POST';

            // await fetch(endpoint, { method: method, headers: { ... } });
            console.log(`Đã ${isSaved ? 'Hủy lưu' : 'Lưu'} bài viết ID: ${postId}`);
        } catch (error) {
            // Nếu API lỗi, trả lại trạng thái cũ
            setIsSaved(isSaved);
            console.error("Lỗi khi lưu bài viết", error);
        }
    };

    return (
        <button
            onClick={handleToggleSave}
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
            {/* Dùng icon trái tim hoặc bookmark */}
            <span>{isSaved ? '💙' : '🤍'}</span>
            {isSaved ? 'Đã lưu' : 'Lưu bài viết'}
        </button>
    );
}

export default SavePostButton;