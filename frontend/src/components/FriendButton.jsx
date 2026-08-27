import React, { useState, useEffect } from 'react';

// Nhớ đổi lại thành link Render của bạn khi đẩy lên mạng nhé
const API_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://social-media-clone-di9z.onrender.com/api';export default function FriendButton({ currentUserId, targetUserId }) {
    const [status, setStatus] = useState('NONE');
    const [loading, setLoading] = useState(true);

    // 1. Lấy trạng thái mối quan hệ ngay khi load component
    useEffect(() => {
        if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/friends/status/${currentUserId}/${targetUserId}`);
                const data = await res.json();
                setStatus(data.status);
            } catch (err) {
                console.error("Lỗi lấy trạng thái bạn bè:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [currentUserId, targetUserId]);

    // 2. Xử lý Gửi lời mời
    const handleSendRequest = async () => {
        setStatus('PENDING_SENT'); // Cập nhật UI ngay cho mượt
        await fetch(`${API_URL}/friends/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requester_id: currentUserId, addressee_id: targetUserId })
        });
    };

    // 3. Xử lý Chấp nhận lời mời
    const handleAccept = async () => {
        setStatus('ACCEPTED');
        await fetch(`${API_URL}/friends/accept`, {
            method: 'PATCH', // Hoặc PUT tùy bạn khai báo ở Backend
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requester_id: targetUserId, addressee_id: currentUserId })
        });
    };

    // 4. Xử lý Hủy kết bạn / Từ chối lời mời
    const handleUnfriend = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn / từ chối không?')) return;
        setStatus('NONE');
        await fetch(`${API_URL}/friends/unfriend`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user1_id: currentUserId, user2_id: targetUserId })
        });
    };

    // --- HIỂN THỊ GIAO DIỆN TƯƠNG ỨNG ---
    if (loading || currentUserId === targetUserId) return null; // Không hiện nút nếu đang tải hoặc đang vào trang của chính mình

    switch (status) {
        case 'NONE':
            return <button className="btn-friend-add" onClick={handleSendRequest}>👤+ Thêm bạn bè</button>;

        case 'PENDING_SENT':
            return <button className="btn-friend-sent" onClick={handleUnfriend}>⏳ Đã gửi lời mời (Hủy)</button>;

        case 'PENDING_RECEIVED':
            return (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-friend-accept" onClick={handleAccept}>✅ Chấp nhận</button>
                    <button className="btn-friend-reject" onClick={handleUnfriend}>❌ Từ chối</button>
                </div>
            );

        case 'ACCEPTED':
            return <button className="btn-friend-accepted" onClick={handleUnfriend}>👥 Bạn bè (Hủy kết bạn)</button>;

        default:
            return null;
    }
}