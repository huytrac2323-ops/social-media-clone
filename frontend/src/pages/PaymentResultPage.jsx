import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../utils/api';
import {
    CheckCircle,
    XCircle,
    Crown,
    ArrowRight,
    Home,
    User,
    Sparkles,
    ShieldCheck,
    Rocket,
    EyeOff
} from 'lucide-react';
import '../styles/App.css';

function PaymentResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            const searchParams = new URLSearchParams(location.search);
            const queryParams = {};
            for (const [key, val] of searchParams.entries()) {
                queryParams[key] = val;
            }

            if (!queryParams.vnp_ResponseCode && !queryParams.vnp_TxnRef) {
                setError('Không tìm thấy thông tin giao dịch VNPAY hợp lệ.');
                setLoading(false);
                return;
            }

            try {
                const token = window.localStorage.getItem('token');
                const res = await safeFetch('/payment/vnpay-verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(queryParams)
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Xác minh giao dịch thất bại.');
                }

                setResult(data);

                if (data.success && data.user) {
                    updateUser({
                        vip_tier: data.user.vip_tier,
                        vip_badge: data.user.vip_badge,
                        is_verified: true,
                        ad_free: true,
                        post_boost_credits: data.user.post_boost_credits,
                        vip_expires_at: data.user.vip_expires_at
                    });
                }
            } catch (err) {
                console.error('Lỗi xác minh VNPAY:', err);
                setError(err.message || 'Lỗi xử lý kết quả thanh toán từ VNPAY.');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [location.search]);

    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('vnp_TxnRef') || '';
    const amount = searchParams.get('vnp_Amount') ? (Number(searchParams.get('vnp_Amount')) / 100).toLocaleString('vi-VN') + ' đ' : '';
    const bankCode = searchParams.get('vnp_BankCode') || '';
    const responseCode = searchParams.get('vnp_ResponseCode') || '';

    const isSuccess = result?.success && responseCode === '00';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '560px',
                width: '100%',
                background: 'var(--bg-surface)',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                textAlign: 'center'
            }}>
                {loading ? (
                    <div style={{ padding: '60px 24px' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            Đang xác minh giao dịch VNPAY...
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Vui lòng đợi giây lát, hệ thống đang đồng bộ với ngân hàng.
                        </p>
                    </div>
                ) : isSuccess ? (
                    <div>
                        {/* Header Thành công */}
                        <div style={{
                            padding: '36px 24px 24px',
                            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 0, 0, 0) 100%)',
                            borderBottom: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                            }}>
                                <CheckCircle size={36} color="#ffffff" />
                            </div>

                            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                Thanh Toán VNPAY Thành Công!
                            </h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                                Chúc mừng bạn đã nâng cấp thành công gói VIP. Các tính năng cao cấp đã được mở khóa ngay lập tức!
                            </p>
                        </div>

                        {/* Chi tiết đơn hàng */}
                        <div style={{ padding: '24px', textAlign: 'left' }}>
                            <div style={{
                                background: 'var(--bg-main)',
                                borderRadius: '16px',
                                padding: '16px 20px',
                                border: '1px solid var(--border-subtle)',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13.5px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Gói dịch vụ:</span>
                                    <strong style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Crown size={15} />
                                        {result?.package?.name || 'Gói VIP NovaGen'}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13.5px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Mã đơn hàng:</span>
                                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{orderId}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13.5px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Số tiền:</span>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{amount}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13.5px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Ngân hàng / Kênh:</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>{bankCode || 'VNPAY'}</strong>
                                </div>
                            </div>

                            {/* Quyền lợi VIP đã kích hoạt */}
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                                ✨ Quyền lợi VIP của bạn đã kích hoạt:
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(0, 149, 246, 0.08)', border: '1px solid rgba(0, 149, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    <ShieldCheck size={16} color="#0095f6" />
                                    <span>Tích xanh chính chủ</span>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    <Crown size={16} color="#eab308" />
                                    <span>Huy hiệu VIP nổi bật</span>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    <Rocket size={16} color="#ec4899" />
                                    <span>Đẩy bài viết ưu tiên</span>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    <EyeOff size={16} color="#10b981" />
                                    <span>Bảng tin 0% quảng cáo</span>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/feed')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 18px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Home size={16} />
                                    <span>Vào Bảng tin ngay</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/profile/${currentUser?.username || ''}`)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 18px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-medium)',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <User size={16} />
                                    <span>Xem Hồ sơ cá nhân</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '40px 24px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <XCircle size={36} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Giao dịch chưa hoàn tất
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px' }}>
                            {error || result?.message || 'Giao dịch qua VNPAY đã bị hủy hoặc không thành công.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '13.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Quay về trang chủ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentResultPage;
