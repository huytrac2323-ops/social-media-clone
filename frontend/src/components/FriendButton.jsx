import React, { useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';

export default function FriendButton({ currentUserId, targetUserId }) {
    const [status, setStatus] = useState('NONE');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
            setLoading(false);
            return;
        }
        let isMounted = true;
        safeFetch(`/friends/status/${currentUserId}/${targetUserId}`)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data?.status) {
                    setStatus(data.status);
                }
            })
            .catch(err => console.error('Lỗi lấy trạng thái bạn bè:', err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [currentUserId, targetUserId]);

    // 2. Xử lý Gửi lời mời
    const handleSendRequest = async () => {
        setStatus('PENDING_SENT'); // Cập nhật UI ngay cho mượt
        try {
            await safeFetch('/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: currentUserId, addressee_id: targetUserId })
            });
        } catch (err) {
            console.error('Lỗi gửi kết bạn:', err);
        }
    };

    // 3. Xử lý Chấp nhận lời mời
    const handleAccept = async () => {
        setStatus('ACCEPTED');
        try {
            await safeFetch('/friends/accept', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: targetUserId, addressee_id: currentUserId })
            });
        } catch (err) {
            console.error('Lỗi chấp nhận kết bạn:', err);
        }
    };

    // 4. Xử lý Hủy kết bạn / Từ chối lời mời
    const handleUnfriend = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn / từ chối không?')) return;
        setStatus('NONE');
        try {
            await safeFetch('/friends/unfriend', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user1_id: currentUserId, user2_id: targetUserId })
            });
        } catch (err) {
            console.error('Lỗi hủy kết bạn:', err);
        }
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