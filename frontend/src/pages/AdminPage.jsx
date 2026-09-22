import React, { useState, useEffect, useCallback } from 'react';
import { safeFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import SidebarNav from '../components/SidebarNav';
import Avatar from '../components/Avatar';
import {
    ShieldCheck,
    Users,
    Sparkles,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Trash2,
    Lock,
    Unlock,
    Search,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    BarChart3,
    Check,
    X
} from 'lucide-react';
import '../styles/App.css';

const CREATOR_LABELS = {
    illustrator: '🎨 Họa sĩ / Minh họa',
    photographer: '📸 Nhiếp ảnh gia',
    musician: '🎵 Nhạc sĩ / Ca sĩ',
    videographer: '🎬 Làm phim / Video',
    writer: '✍️ Nhà văn / Viết lách',
    dancer: '💃 Vũ công / Biên đạo',
    designer: '🖥️ Thiết kế đồ họa',
    gamer: '🎮 Game Creator',
    crafter: '🧶 Thủ công mỹ nghệ',
    other: '✨ Sáng tạo nội dung'
};

export default function AdminPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview'); // overview, verifications, users, posts
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [stats, setStats] = useState(null);
    const [creatorBreakdown, setCreatorBreakdown] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);

    // Verification Requests
    const [requests, setRequests] = useState([]);
    const [requestStatusFilter, setRequestStatusFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionNote, setActionNote] = useState('');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'

    // Users
    const [usersList, setUsersList] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [userVerifiedFilter, setUserVerifiedFilter] = useState('');
    const [userBannedFilter, setUserBannedFilter] = useState('');

    // Posts
    const [postsList, setPostsList] = useState([]);
    const [postSearch, setPostSearch] = useState('');

    const token = window.localStorage.getItem('token');

    // Kiểm tra quyền Admin
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang Quản trị viên (Admin).');
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Fetch thống kê
    const fetchStats = useCallback(async () => {
        try {
            const res = await safeFetch('/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCreatorBreakdown(data.creatorBreakdown || []);
                setRecentUsers(data.recentUsers || []);
            }
        } catch (err) {
            console.error('Lỗi tải stats admin:', err);
        }
    }, [token]);

    // Fetch đơn tích xanh
    const fetchVerificationRequests = useCallback(async () => {
        try {
            const endpoint = `/admin/verification-requests?status=${requestStatusFilter}`;
            const res = await safeFetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error('Lỗi tải đơn xác minh:', err);
        }
    }, [token, requestStatusFilter]);

    // Fetch người dùng
    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (userSearch) params.append('search', userSearch);
            if (userRoleFilter) params.append('role', userRoleFilter);
            if (userVerifiedFilter) params.append('is_verified', userVerifiedFilter);
            if (userBannedFilter) params.append('is_banned', userBannedFilter);

            const res = await safeFetch(`/admin/users?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsersList(data);
            }
        } catch (err) {
            console.error('Lỗi tải người dùng admin:', err);
        }
    }, [token, userSearch, userRoleFilter, userVerifiedFilter, userBannedFilter]);

    // Fetch bài viết
    const fetchPosts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (postSearch) params.append('search', postSearch);
            const res = await safeFetch(`/admin/posts?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPostsList(data);
            }
        } catch (err) {
            console.error('Lỗi tải bài viết admin:', err);
        }
    }, [token, postSearch]);

    // Tải toàn bộ dữ liệu ban đầu
    const loadAllData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            fetchVerificationRequests(),
            fetchUsers(),
            fetchPosts()
        ]);
        setLoading(false);
    }, [fetchStats, fetchVerificationRequests, fetchUsers, fetchPosts]);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            loadAllData();
        }
    }, [currentUser, loadAllData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'overview') await fetchStats();
        if (activeTab === 'verifications') await fetchVerificationRequests();
        if (activeTab === 'users') await fetchUsers();
        if (activeTab === 'posts') await fetchPosts();
        setRefreshing(false);
    };

    // Xử lý duyệt / từ chối đơn tích xanh
    const openActionModal = (req, type) => {
        setSelectedRequest(req);
        setActionType(type);
        setActionNote(type === 'approve' ? 'Hồ sơ đạt tiêu chuẩn Nhà sáng tạo uy tín.' : 'Hồ sơ chưa đủ thông tin hoặc sản phẩm thực tế.');
        setIsActionModalOpen(true);
    };

    const submitRequestAction = async () => {
        if (!selectedRequest) return;
        try {
            const endpoint = `/admin/verification-requests/${selectedRequest.request_id}/${actionType}`;
            const res = await safeFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ admin_note: actionNote })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setIsActionModalOpen(false);
                setSelectedRequest(null);
                fetchVerificationRequests();
                fetchStats();
            } else {
                alert(data.message || 'Thao tác thất bại.');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        }
    };

    // Xử lý Quản lý User
    const handleToggleVerify = async (userId) => {
        try {
            const res = await safeFetch(`/admin/users/${userId}/verify`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUsersList(prev => prev.map(u => u.user_id === userId ? { ...u, is_verified: data.user.is_verified } : u));
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        }
    };

    const handleToggleBan = async (userId) => {
        if (!window.confirm('Bạn có chắc muốn đổi trạng thái khóa/mở khóa tài khoản này?')) return;
        try {
            const res = await safeFetch(`/admin/users/${userId}/ban`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUsersList(prev => prev.map(u => u.user_id === userId ? { ...u, is_banned: data.user.is_banned } : u));
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        }
    };

    const handleUpdateRole = async (userId, currentRole) => {
        const nextRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Bạn có chắc muốn chuyển quyền người dùng này thành "${nextRole}"?`)) return;
        try {
            const res = await safeFetch(`/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: nextRole })
            });
            const data = await res.json();
            if (res.ok) {
                setUsersList(prev => prev.map(u => u.user_id === userId ? { ...u, role: data.user.role } : u));
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        }
    };

    // Xóa bài viết
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết vi phạm này khỏi hệ thống vĩnh viễn?')) return;
        try {
            const res = await safeFetch(`/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPostsList(prev => prev.filter(p => p.post_id !== postId));
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        }
    };

    return (
        <div className="app-shell">
            <div className="app-layout">
                <SidebarNav />

                <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
                    {/* Header Admin */}
                    <div style={{
                        padding: '24px 20px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderBottom: '1px solid var(--border-color, #262626)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
                            }}>
                                <ShieldCheck size={28} color="#ffffff" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-main, #ffffff)' }}>
                                    NovaGen Admin Portal
                                </h1>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #a8a8a8)' }}>
                                    Hệ thống Quản trị, Xét duyệt Tích Xanh & Điều phối Nội dung
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-surface-secondary, rgba(255,255,255,0.06))',
                                    border: '1px solid var(--border-color, #262626)',
                                    color: 'var(--text-main, #ffffff)',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
                                <span>Làm mới</span>
                            </button>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                background: 'rgba(236, 72, 153, 0.15)',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                color: '#f472b6',
                                fontSize: '12px',
                                fontWeight: '700'
                            }}>
                                Quản trị viên: @{currentUser?.username}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--border-color, #262626)',
                        padding: '0 20px',
                        gap: '8px',
                        overflowX: 'auto'
                    }}>
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
                            {
                                id: 'verifications',
                                label: 'Xét duyệt Tích Xanh',
                                icon: ShieldCheck,
                                badge: stats?.pendingRequests > 0 ? stats.pendingRequests : null
                            },
                            { id: 'users', label: 'Quản lý Người dùng', icon: Users },
                            { id: 'posts', label: 'Quản lý Bài viết', icon: FileText }
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '14px 18px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                                        color: isActive ? '#38bdf8' : 'var(--text-muted, #a8a8a8)',
                                        fontWeight: isActive ? '700' : '500',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            padding: '2px 7px',
                                            borderRadius: '10px'
                                        }}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '24px 20px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted, #a8a8a8)' }}>
                                <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 12px' }} />
                                <p>Đang tải dữ liệu quản trị...</p>
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: TỔNG QUAN */}
                                {activeTab === 'overview' && (
                                    <div>
                                        {/* Cards Thống kê */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '16px',
                                            marginBottom: '28px'
                                        }}>
                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px', marginBottom: '8px' }}>Tổng Người dùng</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main, #ffffff)' }}>
                                                    {stats?.totalUsers ?? 0}
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px', marginBottom: '8px' }}>Nhà sáng tạo (Creators)</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#60a5fa' }}>
                                                    {stats?.totalCreators ?? 0}
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px', marginBottom: '8px' }}>Đã cấp Tích Xanh 🛡️</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#22c55e' }}>
                                                    {stats?.totalVerified ?? 0}
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'rgba(234, 179, 8, 0.08)',
                                                border: '1px solid rgba(234, 179, 8, 0.25)'
                                            }}>
                                                <div style={{ color: '#eab308', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Đơn chờ duyệt ⏳</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#eab308' }}>
                                                    {stats?.pendingRequests ?? 0}
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px', marginBottom: '8px' }}>Tổng Bài viết</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main, #ffffff)' }}>
                                                    {stats?.totalPosts ?? 0}
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px', marginBottom: '8px' }}>Tổng Bình luận</div>
                                                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main, #ffffff)' }}>
                                                    {stats?.totalComments ?? 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Creator Type Breakdown & Recent Users */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                                            {/* Phân loại sáng tạo */}
                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #ffffff)' }}>
                                                    Phân bổ Nhà sáng tạo theo lĩnh vực
                                                </h3>
                                                {creatorBreakdown.length === 0 ? (
                                                    <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '13px' }}>Chưa có nhà sáng tạo nào đăng ký thể loại.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {creatorBreakdown.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                                <span style={{ color: 'var(--text-main, #e2e8f0)', fontWeight: '500' }}>
                                                                    {CREATOR_LABELS[item.creator_type] || item.creator_type}
                                                                </span>
                                                                <span style={{
                                                                    background: 'rgba(56, 189, 248, 0.15)',
                                                                    color: '#38bdf8',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    {item.count} người
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Người dùng đăng ký gần đây */}
                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-surface, #1e293b)',
                                                border: '1px solid var(--border-color, #334155)'
                                            }}>
                                                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--text-main, #ffffff)' }}>
                                                    Thành viên mới gia nhập
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {recentUsers.map(u => (
                                                        <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <Avatar user={u} size={36} />
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                                                        {u.username}
                                                                        {u.is_verified && (
                                                                            <span style={{ color: '#0095f6', marginLeft: '4px' }}>✓</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                                                                        {u.creator_type ? (CREATOR_LABELS[u.creator_type] || u.creator_type) : 'Thành viên'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                background: u.role === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                                color: u.role === 'admin' ? '#f472b6' : 'var(--text-muted, #94a3b8)',
                                                                fontWeight: '600'
                                                            }}>
                                                                {u.role}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: XÉT DUYỆT TÍCH XANH */}
                                {activeTab === 'verifications' && (
                                    <div>
                                        {/* Status Filter */}
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                            {[
                                                { id: 'pending', label: 'Chờ duyệt ⏳' },
                                                { id: 'approved', label: 'Đã phê duyệt ✅' },
                                                { id: 'rejected', label: 'Đã từ chối ❌' },
                                                { id: 'all', label: 'Tất cả đơn' }
                                            ].map(st => (
                                                <button
                                                    key={st.id}
                                                    type="button"
                                                    onClick={() => setRequestStatusFilter(st.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        background: requestStatusFilter === st.id ? '#38bdf8' : 'var(--bg-surface, #1e293b)',
                                                        color: requestStatusFilter === st.id ? '#0f172a' : 'var(--text-main, #ffffff)',
                                                        fontWeight: '700',
                                                        border: '1px solid var(--border-color, #334155)',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    {st.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Danh sách đơn */}
                                        {requests.length === 0 ? (
                                            <div style={{
                                                padding: '40px',
                                                textAlign: 'center',
                                                background: 'var(--bg-surface, #1e293b)',
                                                borderRadius: '12px',
                                                color: 'var(--text-muted, #94a3b8)'
                                            }}>
                                                Không có đơn xin cấp tích xanh nào trong danh mục này.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                {requests.map(req => (
                                                    <div
                                                        key={req.request_id}
                                                        style={{
                                                            padding: '18px 20px',
                                                            borderRadius: '12px',
                                                            background: 'var(--bg-surface, #1e293b)',
                                                            border: '1px solid var(--border-color, #334155)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '12px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <Avatar user={{ profile_photo_url: req.profile_photo_url, username: req.username }} size={44} />
                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <strong style={{ fontSize: '15px', color: 'var(--text-main, #ffffff)' }}>
                                                                            {req.full_name}
                                                                        </strong>
                                                                        <Link to={`/profile/${req.username}`} style={{ fontSize: '13px', color: '#38bdf8' }}>
                                                                            (@{req.username})
                                                                        </Link>
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                                                                        {req.email} • Gửi ngày {new Date(req.created_at).toLocaleString('vi-VN')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Status Pill */}
                                                            <div>
                                                                {req.status === 'pending' && (
                                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', fontSize: '12px', fontWeight: '700' }}>
                                                                        Đang chờ duyệt
                                                                    </span>
                                                                )}
                                                                {req.status === 'approved' && (
                                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '12px', fontWeight: '700' }}>
                                                                        Đã phê duyệt
                                                                    </span>
                                                                )}
                                                                {req.status === 'rejected' && (
                                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>
                                                                        Đã từ chối
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Lĩnh vực & Portfolio */}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-main, #e2e8f0)' }}>
                                                            <div>
                                                                <strong>Lĩnh vực: </strong>
                                                                <span style={{ color: '#60a5fa' }}>{CREATOR_LABELS[req.creator_type] || req.creator_type || 'Chưa chọn'}</span>
                                                            </div>
                                                            {req.portfolio_url && (
                                                                <div>
                                                                    <strong>Portfolio: </strong>
                                                                    <a href={req.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                        {req.portfolio_url} <ExternalLink size={12} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {req.document_url && (
                                                                <div>
                                                                    <strong>Tài liệu/Ảnh đính kèm: </strong>
                                                                    <a href={req.document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                        Xem tài liệu <ExternalLink size={12} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Lý do xin cấp */}
                                                        <div style={{
                                                            background: 'var(--bg-surface-secondary, rgba(0,0,0,0.2))',
                                                            padding: '12px 14px',
                                                            borderRadius: '8px',
                                                            fontSize: '13px',
                                                            color: 'var(--text-main, #cbd5e1)',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            <strong>Lý do & Thành tích: </strong>
                                                            {req.reason}
                                                        </div>

                                                        {req.admin_note && (
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>
                                                                Ghi chú Admin: "{req.admin_note}"
                                                            </div>
                                                        )}

                                                        {/* Action Buttons if Pending */}
                                                        {req.status === 'pending' && (
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openActionModal(req, 'reject')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        padding: '8px 16px',
                                                                        borderRadius: '8px',
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                        color: '#ef4444',
                                                                        fontWeight: '700',
                                                                        cursor: 'pointer',
                                                                        fontSize: '13px'
                                                                    }}
                                                                >
                                                                    <XCircle size={15} />
                                                                    Từ chối
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openActionModal(req, 'approve')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        padding: '8px 18px',
                                                                        borderRadius: '8px',
                                                                        background: '#22c55e',
                                                                        border: 'none',
                                                                        color: '#ffffff',
                                                                        fontWeight: '700',
                                                                        cursor: 'pointer',
                                                                        fontSize: '13px',
                                                                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                                                                    }}
                                                                >
                                                                    <CheckCircle size={15} />
                                                                    Phê duyệt & Cấp Tích Xanh
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG */}
                                {activeTab === 'users' && (
                                    <div>
                                        {/* Search & Filter Bar */}
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                            marginBottom: '20px',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ flex: '1 1 240px', position: 'relative' }}>
                                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted, #94a3b8)' }} />
                                                <input
                                                    type="text"
                                                    value={userSearch}
                                                    onChange={e => setUserSearch(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                                                    placeholder="Tìm theo username, email, địa chỉ..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 14px 10px 36px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color, #334155)',
                                                        background: 'var(--bg-surface, #1e293b)',
                                                        color: 'var(--text-main, #ffffff)',
                                                        fontSize: '13px',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>

                                            <select
                                                value={userRoleFilter}
                                                onChange={e => setUserRoleFilter(e.target.value)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color, #334155)',
                                                    background: 'var(--bg-surface, #1e293b)',
                                                    color: 'var(--text-main, #ffffff)',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value="">Tất cả quyền</option>
                                                <option value="admin">Quản trị (Admin)</option>
                                                <option value="user">Người dùng (User)</option>
                                            </select>

                                            <select
                                                value={userVerifiedFilter}
                                                onChange={e => setUserVerifiedFilter(e.target.value)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color, #334155)',
                                                    background: 'var(--bg-surface, #1e293b)',
                                                    color: 'var(--text-main, #ffffff)',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value="">Tất cả tích xanh</option>
                                                <option value="true">Đã có tích xanh 🛡️</option>
                                                <option value="false">Chưa có tích xanh</option>
                                            </select>

                                            <select
                                                value={userBannedFilter}
                                                onChange={e => setUserBannedFilter(e.target.value)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color, #334155)',
                                                    background: 'var(--bg-surface, #1e293b)',
                                                    color: 'var(--text-main, #ffffff)',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value="">Tất cả trạng thái</option>
                                                <option value="false">Đang hoạt động</option>
                                                <option value="true">Đã bị khóa</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={fetchUsers}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: '8px',
                                                    background: '#38bdf8',
                                                    border: 'none',
                                                    color: '#0f172a',
                                                    fontWeight: '700',
                                                    fontSize: '13px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Lọc
                                            </button>
                                        </div>

                                        {/* Bảng Người dùng */}
                                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color, #334155)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', background: 'var(--bg-surface, #1e293b)' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color, #334155)', background: 'var(--bg-surface-secondary, rgba(255,255,255,0.02))' }}>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Người dùng</th>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Lĩnh vực</th>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Quyền</th>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Tích Xanh</th>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Trạng thái</th>
                                                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)' }}>Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {usersList.map(u => (
                                                        <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <Avatar user={u} size={36} />
                                                                    <div>
                                                                        <Link to={`/profile/${u.username}`} style={{ fontWeight: '600', color: 'var(--text-main, #ffffff)', textDecoration: 'none' }}>
                                                                            {u.username}
                                                                        </Link>
                                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>{u.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#60a5fa' }}>
                                                                {CREATOR_LABELS[u.creator_type] || u.creator_type || '—'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: u.role === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                    color: u.role === 'admin' ? '#f472b6' : 'var(--text-muted, #94a3b8)'
                                                                }}>
                                                                    {u.role}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleVerify(u.user_id)}
                                                                    title="Bấm để bật/tắt tích xanh"
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '6px',
                                                                        border: 'none',
                                                                        background: u.is_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                        color: u.is_verified ? '#22c55e' : 'var(--text-muted, #94a3b8)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: '700'
                                                                    }}
                                                                >
                                                                    {u.is_verified ? '🛡️ Có tích' : 'Chưa có'}
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: u.is_banned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                                                    color: u.is_banned ? '#ef4444' : '#22c55e'
                                                                }}>
                                                                    {u.is_banned ? 'Đã khóa' : 'Bình thường'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateRole(u.user_id, u.role)}
                                                                        title={u.role === 'admin' ? 'Hạ quyền xuống user' : 'Thăng cấp lên Admin'}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid var(--border-color, #334155)',
                                                                            background: 'transparent',
                                                                            color: 'var(--text-main, #ffffff)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '11px'
                                                                        }}
                                                                    >
                                                                        {u.role === 'admin' ? 'Hạ User' : 'Set Admin'}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleBan(u.user_id)}
                                                                        title={u.is_banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid var(--border-color, #334155)',
                                                                            background: u.is_banned ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                            color: u.is_banned ? '#22c55e' : '#ef4444',
                                                                            cursor: 'pointer',
                                                                            fontSize: '11px'
                                                                        }}
                                                                    >
                                                                        {u.is_banned ? <Unlock size={13} /> : <Lock size={13} />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: QUẢN LÝ BÀI VIẾT */}
                                {activeTab === 'posts' && (
                                    <div>
                                        {/* Search Posts */}
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted, #94a3b8)' }} />
                                                <input
                                                    type="text"
                                                    value={postSearch}
                                                    onChange={e => setPostSearch(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && fetchPosts()}
                                                    placeholder="Tìm bài viết theo nội dung hoặc tên người đăng..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 14px 10px 36px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color, #334155)',
                                                        background: 'var(--bg-surface, #1e293b)',
                                                        color: 'var(--text-main, #ffffff)',
                                                        fontSize: '13px',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={fetchPosts}
                                                style={{
                                                    padding: '10px 18px',
                                                    borderRadius: '8px',
                                                    background: '#38bdf8',
                                                    border: 'none',
                                                    color: '#0f172a',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Tìm
                                            </button>
                                        </div>

                                        {/* Posts Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                            {postsList.map(post => (
                                                <div
                                                    key={post.post_id}
                                                    style={{
                                                        borderRadius: '12px',
                                                        background: 'var(--bg-surface, #1e293b)',
                                                        border: '1px solid var(--border-color, #334155)',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}
                                                >
                                                    {post.photo_url && (
                                                        <img
                                                            src={post.photo_url}
                                                            alt=""
                                                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                            <Avatar user={{ username: post.username, profile_photo_url: post.profile_photo_url }} size={28} />
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                                                {post.username}
                                                            </span>
                                                        </div>
                                                        <p style={{
                                                            fontSize: '13px',
                                                            color: 'var(--text-main, #cbd5e1)',
                                                            margin: '0 0 12px',
                                                            lineHeight: '1.4',
                                                            flex: 1
                                                        }}>
                                                            {post.caption || 'Không có mô tả'}
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted, #94a3b8)', borderTop: '1px solid var(--border-color, #334155)', paddingTop: '10px' }}>
                                                            <span>❤️ {post.like_count || 0} • 💬 {post.comment_count || 0}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeletePost(post.post_id)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                    color: '#ef4444',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                <Trash2 size={13} />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal Phê duyệt / Từ chối đơn tích xanh */}
            {isActionModalOpen && selectedRequest && (
                <div className="modal-overlay" onClick={() => setIsActionModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: actionType === 'approve' ? '#22c55e' : '#ef4444' }}>
                            {actionType === 'approve' ? 'Phê duyệt & Cấp Tích Xanh 🛡️' : 'Từ chối đơn xin cấp tích xanh'}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-main, #ffffff)', margin: '0 0 14px' }}>
                            Người dùng: <strong>{selectedRequest.full_name}</strong> (@{selectedRequest.username})
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main, #ffffff)' }}>
                                Ghi chú phản hồi đến người dùng:
                            </label>
                            <textarea
                                value={actionNote}
                                onChange={e => setActionNote(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color, #334155)',
                                    background: 'var(--bg-surface-secondary, rgba(255,255,255,0.05))',
                                    color: 'var(--text-main, #ffffff)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsActionModalOpen(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-color, #334155)',
                                    color: 'var(--text-main, #ffffff)',
                                    cursor: 'pointer'
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={submitRequestAction}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: actionType === 'approve' ? '#22c55e' : '#ef4444',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Xác nhận {actionType === 'approve' ? 'Duyệt' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
