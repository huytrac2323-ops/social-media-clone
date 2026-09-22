import React, { useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, X, Sparkles, Send, ExternalLink } from 'lucide-react';
import '../styles/Modal.css';

const CREATOR_TYPES = [
    { value: 'illustrator', label: '🎨 Họa sĩ / Minh họa (Digital art, comic)' },
    { value: 'photographer', label: '📸 Nhiếp ảnh gia (Phong cảnh, chân dung, sự kiện)' },
    { value: 'musician', label: '🎵 Nhạc sĩ / Ca sĩ (Sáng tác, ca hát, sản xuất)' },
    { value: 'videographer', label: '🎬 Làm phim / Video (YouTuber, TikToker, đạo diễn)' },
    { value: 'writer', label: '✍️ Nhà văn / Copywriter (Viết truyện, blog, nội dung)' },
    { value: 'dancer', label: '💃 Vũ công / Biên đạo (Nhảy cover, biểu diễn)' },
    { value: 'designer', label: '🖥️ Thiết kế đồ họa / UI-UX (Branding, 3D, thiết kế)' },
    { value: 'gamer', label: '🎮 Game Creator / Streamer (Streamer, esport, review)' },
    { value: 'crafter', label: '🧶 Thủ công mỹ nghệ / DIY (Handmade, trang sức)' },
    { value: 'other', label: '✨ Nhà sáng tạo nội dung khác' }
];

function RequestVerificationModal({ isOpen, onClose, onSubmitted }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [existingRequest, setExistingRequest] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form states
    const [fullName, setFullName] = useState(currentUser?.username || '');
    const [creatorType, setCreatorType] = useState(currentUser?.creator_type || 'illustrator');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [reason, setReason] = useState('');
    const [documentUrl, setDocumentUrl] = useState('');
    const [isReapplying, setIsReapplying] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchMyRequest = async () => {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            try {
                const token = window.localStorage.getItem('token');
                const res = await safeFetch('/verification/my-request', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setExistingRequest(data.request);
                }
            } catch (err) {
                console.warn('Không thể tải đơn xác minh:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyRequest();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!fullName.trim()) {
            setError('Vui lòng nhập họ và tên thật hoặc nghệ danh đại diện của bạn.');
            return;
        }

        if (!reason.trim()) {
            setError('Vui lòng chia sẻ lý do hoặc các tác phẩm nổi bật của bạn để Admin xét duyệt.');
            return;
        }

        setSubmitting(true);
        try {
            const token = window.localStorage.getItem('token');
            const res = await safeFetch('/verification/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    creator_type: creatorType,
                    portfolio_url: portfolioUrl.trim(),
                    reason: reason.trim(),
                    document_url: documentUrl.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Không thể gửi đơn xin cấp tích xanh.');
            } else {
                setSuccessMessage('Đơn yêu cầu cấp Tích Xanh của bạn đã được gửi thành công!');
                setExistingRequest(data.request);
                setIsReapplying(false);
                if (onSubmitted) onSubmitted();
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '560px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #262626)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(56, 189, 248, 0.4)'
                        }}>
                            <ShieldCheck size={24} color="#38bdf8" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-main, #ffffff)' }}>
                                Xác minh Tích Xanh Nhà sáng tạo
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #a8a8a8)' }}>
                                Khẳng định danh tính, nâng cao độ tin cậy và nổi bật hơn
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted, #a8a8a8)', cursor: 'pointer', padding: '4px' }}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ paddingTop: '16px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #a8a8a8)' }}>
                            <Clock size={28} className="spin-animation" style={{ margin: '0 auto 10px' }} />
                            <p>Đang kiểm tra trạng thái xác minh...</p>
                        </div>
                    ) : existingRequest && !isReapplying ? (
                        /* Đã có đơn trước đó */
                        <div>
                            {existingRequest.status === 'pending' && (
                                <div style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: 'rgba(234, 179, 8, 0.1)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', fontWeight: '700', marginBottom: '8px' }}>
                                        <Clock size={20} />
                                        <span>Đơn yêu cầu đang chờ phê duyệt</span>
                                    </div>
                                    <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-main, #e2e8f0)', lineHeight: '1.6' }}>
                                        Đơn xin cấp tích xanh của bạn gửi ngày <strong>{new Date(existingRequest.created_at).toLocaleDateString('vi-VN')}</strong> đang được Ban Quản trị NovaGen xem xét.
                                    </p>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                                        <div><strong>Họ tên:</strong> {existingRequest.full_name}</div>
                                        <div><strong>Lĩnh vực:</strong> {existingRequest.creator_type || 'Chưa phân loại'}</div>
                                        {existingRequest.portfolio_url && (
                                            <div style={{ marginTop: '4px' }}>
                                                <strong>Portfolio: </strong>
                                                <a href={existingRequest.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
                                                    {existingRequest.portfolio_url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {existingRequest.status === 'approved' && (
                                <div style={{
                                    padding: '24px',
                                    borderRadius: '12px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    textAlign: 'center',
                                    marginBottom: '16px'
                                }}>
                                    <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                                    <h4 style={{ margin: '0 0 8px', fontSize: '18px', color: '#22c55e', fontWeight: '700' }}>
                                        Tài khoản của bạn đã được cấp Tích Xanh!
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main, #e2e8f0)', lineHeight: '1.6' }}>
                                        Huy hiệu xác minh đã kích hoạt trên trang cá nhân và các bài viết của bạn. Hãy tiếp tục sáng tạo những nội dung chất lượng nhé!
                                    </p>
                                </div>
                            )}

                            {existingRequest.status === 'rejected' && (
                                <div style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', marginBottom: '8px' }}>
                                        <AlertCircle size={20} />
                                        <span>Yêu cầu trước đó chưa được duyệt</span>
                                    </div>
                                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-main, #e2e8f0)' }}>
                                        Lý do từ Ban Quản Trị:
                                    </p>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        color: '#f87171',
                                        fontStyle: 'italic',
                                        marginBottom: '16px'
                                    }}>
                                        "{existingRequest.admin_note || 'Hồ sơ chưa đáp ứng đủ tiêu chuẩn cấp tích xanh.'}"
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsReapplying(true)}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: '8px',
                                            background: '#38bdf8',
                                            border: 'none',
                                            color: '#0f172a',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Gửi lại đơn xin mới với thông tin bổ sung
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '9px 18px',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        border: '1px solid var(--border-color, #262626)',
                                        color: 'var(--text-main, #ffffff)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Form tạo yêu cầu mới */
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {error && (
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    fontSize: '13px'
                                }}>
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    color: '#22c55e',
                                    fontSize: '13px'
                                }}>
                                    {successMessage}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                    Họ và tên thật hoặc Nghệ danh đại diện *
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn A hoặc Trực Art"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #262626)',
                                        background: 'var(--bg-surface-secondary, rgba(255,255,255,0.05))',
                                        color: 'var(--text-main, #ffffff)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                    Lĩnh vực sáng tạo chính *
                                </label>
                                <select
                                    value={creatorType}
                                    onChange={(e) => setCreatorType(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #262626)',
                                        background: 'var(--bg-surface-secondary, #1e293b)',
                                        color: 'var(--text-main, #ffffff)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {CREATOR_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                    Liên kết Portfolio / Kênh truyền thông (YouTube, Behance, Facebook, TikTok...)
                                </label>
                                <input
                                    type="url"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    placeholder="https://behance.net/yourprofile hoặc link kênh"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #262626)',
                                        background: 'var(--bg-surface-secondary, rgba(255,255,255,0.05))',
                                        color: 'var(--text-main, #ffffff)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                    Lý do xin cấp tích xanh & Giới thiệu thành tích *
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Hãy mô tả ngắn gọn về quá trình hoạt động sáng tạo, các tác phẩm tiêu biểu hoặc lượng người hâm mộ của bạn để Admin xét duyệt..."
                                    rows={4}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #262626)',
                                        background: 'var(--bg-surface-secondary, rgba(255,255,255,0.05))',
                                        color: 'var(--text-main, #ffffff)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                                    Giấy tờ chứng minh / Ảnh thẻ / Liên kết tài liệu (Tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={documentUrl}
                                    onChange={(e) => setDocumentUrl(e.target.value)}
                                    placeholder="Đường link Google Drive (ảnh CCCD che số bảo mật / giải thưởng / bài báo...)"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #262626)',
                                        background: 'var(--bg-surface-secondary, rgba(255,255,255,0.05))',
                                        color: 'var(--text-main, #ffffff)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Quyền lợi tích xanh */}
                            <div style={{
                                padding: '12px 14px',
                                borderRadius: '8px',
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                fontSize: '13px',
                                color: '#7dd3fc',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={16} /> Quyền lợi khi sở hữu Tích Xanh:
                                </div>
                                <div>• Tăng độ uy tín và tránh tình trạng bị mạo danh tên tuổi</div>
                                <div>• Được ưu tiên hiển thị trên trang Khám phá và Bộ lọc Nhà sáng tạo</div>
                                <div>• Huy hiệu Tích Xanh chính thức xuất hiện cạnh tên trên mọi bài viết</div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        border: '1px solid var(--border-color, #262626)',
                                        color: 'var(--text-main, #ffffff)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 22px',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        opacity: submitting ? 0.7 : 1,
                                        boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
                                    }}
                                >
                                    <Send size={16} />
                                    {submitting ? 'Đang gửi đơn...' : 'Gửi đơn xét duyệt'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RequestVerificationModal;
