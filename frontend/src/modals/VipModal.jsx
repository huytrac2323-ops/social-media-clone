import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../utils/api';
import {
    Crown,
    CheckCircle2,
    Zap,
    Shield,
    Sparkles,
    Rocket,
    EyeOff,
    Check,
    CreditCard,
    X,
    ExternalLink,
    HelpCircle
} from 'lucide-react';
import '../styles/Modal.css';

const PACKAGES = [
    {
        id: 'vip_creator',
        name: 'VIP Creator',
        subtitle: 'Dành cho Nhà Sáng Tạo độc lập & Nghệ sĩ',
        price: 59000,
        priceDisplay: '59.000 đ',
        period: '/ tháng',
        color: '#eab308',
        bgGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
        popular: false,
        features: [
            { icon: <CheckCircle2 size={16} color="#0095f6" />, text: 'Tích xanh xác thực hồ sơ uy tín (Blue Checkmark)' },
            { icon: <Crown size={16} color="#eab308" />, text: 'Huy hiệu Vương miện Vàng nổi bật trên hồ sơ & bài viết' },
            { icon: <Rocket size={16} color="#f97316" />, text: '5 lượt Đẩy bài viết (Post Boost) ưu tiên TOP Bảng tin mỗi tháng' },
            { icon: <EyeOff size={16} color="#10b981" />, text: 'Lướt bảng tin hoàn toàn KHÔNG QUẢNG CÁO (Ad-Free)' },
            { icon: <Sparkles size={16} color="#a855f7" />, text: 'Ưu tiên hiển thị khi tìm kiếm Nhà sáng tạo (NST) hợp tác' },
            { icon: <Check size={16} color="#64748b" />, text: 'Đăng tải dự án chất lượng cao không nén ảnh' }
        ]
    },
    {
        id: 'vip_pro',
        name: 'VIP Pro',
        subtitle: 'Dành cho Chuyên Gia, Studio & Doanh Nghiệp',
        price: 129000,
        priceDisplay: '129.000 đ',
        period: '/ tháng',
        color: '#38bdf8',
        bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(168, 85, 247, 0.12) 100%)',
        borderColor: 'rgba(56, 189, 248, 0.6)',
        popular: true,
        features: [
            { icon: <CheckCircle2 size={16} color="#0095f6" />, text: 'Tích xanh cao cấp & Huy hiệu Kim Cương VIP Pro' },
            { icon: <Crown size={16} color="#38bdf8" />, text: 'Khung viền Avatar phát sáng độc quyền & Vương miện Pro' },
            { icon: <Rocket size={16} color="#ec4899" />, text: '20 lượt Đẩy bài viết (Post Boost) ưu tiên cao nhất' },
            { icon: <EyeOff size={16} color="#10b981" />, text: 'Bảng tin 100% không quảng cáo & tải trang nhanh hơn' },
            { icon: <Zap size={16} color="#eab308" />, text: 'Gắn thẻ Nhà Sáng Tạo Hàng Đầu trong danh mục Tìm kiếm NST' },
            { icon: <Sparkles size={16} color="#6366f1" />, text: 'Ưu tiên duyệt bài tuyển dụng hợp tác & việc làm sáng tạo' },
            { icon: <Shield size={16} color="#10b981" />, text: 'Hỗ trợ kỹ thuật 24/7 & Bảo vệ bản quyền tác phẩm' }
        ]
    }
];

function VipModal({ isOpen, onClose }) {
    const { currentUser, updateUser } = useAuth();
    const [selectedPackageId, setSelectedPackageId] = useState('vip_creator');
    const [bankCode, setBankCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setStatusMsg(null);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentVipTier = currentUser?.vip_tier;
    const isAlreadyVip = currentVipTier && currentVipTier !== 'free';

    const handleVnpayPayment = async () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để thực hiện nâng cấp gói VIP.');
            return;
        }

        setLoading(true);
        setStatusMsg({ type: 'info', text: 'Đang kết nối cổng thanh toán VNPAY an toàn...' });

        try {
            const token = window.localStorage.getItem('token');
            const res = await safeFetch('/payment/create-payment-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    packageId: selectedPackageId,
                    bankCode: bankCode && bankCode.trim() !== '' ? bankCode.trim() : undefined,
                    userId: currentUser.user_id || currentUser.id,
                    returnUrl: `${window.location.origin}/payment/result`
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi khi tạo liên kết thanh toán VNPAY');
            }

            if (data.paymentUrl) {
                setStatusMsg({ type: 'success', text: 'Đang chuyển hướng sang cổng thanh toán VNPAY...' });
                // Chuyển hướng tới cổng thanh toán VNPAY Sandbox / Production
                window.location.href = data.paymentUrl;
            } else {
                throw new Error('Không nhận được đường dẫn thanh toán từ máy chủ.');
            }
        } catch (err) {
            console.error('Lỗi thanh toán VNPAY:', err);
            setStatusMsg({ type: 'error', text: err.message || 'Không thể kết nối đến cổng thanh toán VNPAY.' });
            setLoading(false);
        }
    };

    const handleSandboxInstantTest = async () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để thử nghiệm tính năng VIP.');
            return;
        }

        setLoading(true);
        setStatusMsg({ type: 'info', text: 'Đang kích hoạt gói VIP trực tiếp trong môi trường thử nghiệm Sandbox...' });

        try {
            const token = window.localStorage.getItem('token');
            const res = await safeFetch('/payment/test-sandbox-activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    packageId: selectedPackageId,
                    userId: currentUser.user_id || currentUser.id
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Kích hoạt thử nghiệm thất bại.');
            }

            // Đồng bộ dữ liệu người dùng mới vào AuthContext
            if (data.user) {
                updateUser({
                    vip_tier: data.user.vip_tier,
                    vip_badge: data.user.vip_badge,
                    is_verified: true,
                    ad_free: true,
                    post_boost_credits: data.user.post_boost_credits,
                    vip_expires_at: data.user.vip_expires_at
                });
            }

            setStatusMsg({
                type: 'success',
                text: `🎉 ${data.message} Bạn hiện đã sở hữu Tích xanh, Huy hiệu VIP và Bảng tin không quảng cáo!`
            });

            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 1800);
        } catch (err) {
            console.error('Lỗi kích hoạt Sandbox:', err);
            setStatusMsg({ type: 'error', text: err.message || 'Kích hoạt thử nghiệm thất bại.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 999999 }}>
            <div
                className="modal-content vip-modal-container"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '820px',
                    width: '95%',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    borderRadius: '20px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                    padding: 0
                }}
            >
                {/* Modal Header */}
                <div style={{
                    position: 'relative',
                    padding: '28px 24px 20px',
                    background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.12) 0%, rgba(0, 0, 0, 0) 100%)',
                    borderBottom: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="close-btn"
                        style={{ position: 'absolute', right: '16px', top: '16px' }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '54px',
                        height: '54px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                        boxShadow: '0 8px 20px rgba(234, 179, 8, 0.35)',
                        marginBottom: '12px'
                    }}>
                        <Crown size={28} color="#000" />
                    </div>

                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                        letterSpacing: '-0.5px'
                    }}>
                        Nâng Cấp Gói VIP NovaGen
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        maxWidth: '520px',
                        margin: '0 auto',
                        lineHeight: 1.5
                    }}>
                        Mở khóa Tích xanh chính chủ, Huy hiệu nổi bật, Bảng tin không quảng cáo và đẩy bài viết lên TOP đầu mạng xã hội.
                    </p>

                    {/* Trạng thái VIP hiện tại nếu có */}
                    {isAlreadyVip && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '14px',
                            padding: '6px 14px',
                            borderRadius: '999px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            fontSize: '12.5px',
                            fontWeight: '600'
                        }}>
                            <Sparkles size={14} />
                            <span>Gói hiện tại: <strong>{currentVipTier === 'pro' ? 'VIP Pro' : 'VIP Creator'}</strong> • Lượt đẩy bài còn lại: <strong>{currentUser.post_boost_credits || 0}</strong></span>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '24px' }}>
                    {/* Status notification */}
                    {statusMsg && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: statusMsg.type === 'error'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : (statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                            color: statusMsg.type === 'error'
                                ? '#ef4444'
                                : (statusMsg.type === 'success' ? '#10b981' : '#3b82f6'),
                            border: `1px solid ${statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : (statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)')}`
                        }}>
                            {statusMsg.text}
                        </div>
                    )}

                    {/* Package Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '18px',
                        marginBottom: '24px'
                    }}>
                        {PACKAGES.map(pkg => {
                            const isSelected = selectedPackageId === pkg.id;
                            return (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackageId(pkg.id)}
                                    style={{
                                        position: 'relative',
                                        padding: '22px',
                                        borderRadius: '16px',
                                        background: isSelected ? pkg.bgGradient : 'var(--bg-main)',
                                        border: `2px solid ${isSelected ? pkg.borderColor : 'var(--border-subtle)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : 'none'
                                    }}
                                >
                                    {pkg.popular && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '18px',
                                            padding: '2px 10px',
                                            borderRadius: '999px',
                                            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 4px 10px rgba(236, 72, 153, 0.4)'
                                        }}>
                                            PHỔ BIẾN NHẤT
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Crown size={22} color={pkg.color} />
                                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                                                    {pkg.name}
                                                </h3>
                                            </div>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? pkg.color : 'var(--border-medium)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isSelected ? pkg.color : 'transparent'
                                            }}>
                                                {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {pkg.subtitle}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                                            <span style={{ fontSize: '26px', fontWeight: '900', color: pkg.color }}>
                                                {pkg.priceDisplay}
                                            </span>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {pkg.period}
                                            </span>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {pkg.features.map((feat, idx) => (
                                                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                        <span style={{ flexShrink: 0, marginTop: '2px' }}>{feat.icon}</span>
                                                        <span>{feat.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payment Gateway Options & Actions */}
                    <div style={{
                        background: 'var(--bg-main)',
                        padding: '18px 20px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={18} color="#0095f6" />
                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Cổng thanh toán: VNPAY (Thẻ ATM nội địa, VNPAY-QR, Thẻ quốc tế)
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', background: 'rgba(0, 149, 246, 0.1)', color: '#0095f6', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                TỰ ĐỘNG KÍCH HOẠT
                            </span>
                        </div>

                        {/* Bank Code Selection (Optional) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                Phương thức mong muốn:
                            </label>
                            <select
                                value={bankCode}
                                onChange={e => setBankCode(e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Tất cả phương thức VNPAY (Khuyên dùng)</option>
                                <option value="VNPAYQR">Thanh toán qua ứng dụng hỗ trợ VNPAY-QR</option>
                                <option value="VNBANK">Thẻ ATM / Tài khoản ngân hàng nội địa</option>
                                <option value="INTCARD">Thẻ thanh toán quốc tế (Visa, Master, JCB)</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={handleVnpayPayment}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #005baa, #0095f6)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '15px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 14px rgba(0, 91, 170, 0.35)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <CreditCard size={18} />
                            <span>{loading ? 'Đang xử lý...' : 'Thanh toán an toàn qua cổng VNPAY'}</span>
                            <ExternalLink size={16} />
                        </button>

                        {/* Test Sandbox Button for instant evaluation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <button
                                type="button"
                                onClick={handleSandboxInstantTest}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '11px 14px',
                                    borderRadius: '12px',
                                    background: 'rgba(234, 179, 8, 0.12)',
                                    color: '#eab308',
                                    border: '1px dashed rgba(234, 179, 8, 0.4)',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Kích hoạt trực tiếp ngay lập tức để kiểm tra tính năng VIP mà không cần nhập mã OTP ngân hàng"
                            >
                                <Zap size={15} />
                                <span>Kích hoạt thử nghiệm nhanh (Sandbox Test Mode)</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            🔒 Giao dịch được bảo mật bởi chuẩn thanh toán VNPAY API • Kích hoạt quyền lợi ngay sau khi hoàn tất
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VipModal;
