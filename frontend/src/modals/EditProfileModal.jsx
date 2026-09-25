import React, { useState } from 'react';
import '../styles/Modal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Camera, Lock, Globe, MapPin, Home, Calendar, Sparkles, Palette, Mail, Phone, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck, Briefcase } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';

const CREATOR_TYPES = [
  { value: null,           emoji: '👤', label: 'Người dùng thường',     desc: 'Không hiển thị huy hiệu sáng tạo' },
  { value: 'illustrator',  emoji: '🎨', label: 'Họa sĩ / Minh họa',     desc: 'Vẽ tranh, digital art, anime, fanart' },
  { value: 'photographer', emoji: '📸', label: 'Nhiếp ảnh gia',          desc: 'Chụp ảnh phong cảnh, chân dung, sự kiện' },
  { value: 'musician',     emoji: '🎵', label: 'Nhạc sĩ / Ca sĩ',       desc: 'Sáng tác, beatmaker, ca hát, biểu diễn' },
  { value: 'videographer', emoji: '🎬', label: 'Làm phim / Video',       desc: 'YouTuber, TikToker, dựng video, vlog' },
  { value: 'writer',       emoji: '✍️',  label: 'Nhà văn / Copywriter',  desc: 'Viết truyện, blog, dịch thuật, thơ' },
  { value: 'dancer',       emoji: '💃', label: 'Vũ công / Biên đạo',    desc: 'Nhảy cover, biên đạo múa, biểu diễn' },
  { value: 'designer',     emoji: '🖥️', label: 'Thiết kế đồ họa',       desc: 'UI/UX, logo, poster, branding, 3D' },
  { value: 'gamer',        emoji: '🎮', label: 'Game Creator',            desc: 'Streamer, game dev, review gaming' },
  { value: 'crafter',      emoji: '🧶', label: 'Thủ công / DIY',         desc: 'Handmade, đồ gốm, trang sức, decor' },
];

function EditProfileModal({ user, onClose, navigate }) {
  const { updateUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [openForCollab, setOpenForCollab] = useState(user?.open_for_collab !== false);
  const [address, setAddress] = useState(user.address || '');
  const [hometown, setHometown] = useState(user.hometown || '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [interests, setInterests] = useState(user.interests || '');
  const [creatorType, setCreatorType] = useState(user?.creator_type || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.is_private));
  const [isSaving, setIsSaving] = useState(false);

  // Email & Số điện thoại (SĐT)
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [emailVerified, setEmailVerified] = useState(Boolean(user.email_verified));
  const [phoneVerified, setPhoneVerified] = useState(Boolean(user.phone_verified));

  // Trạng thái modal con / box xác thực OTP
  const [otpTarget, setOtpTarget] = useState(null); // 'email' | 'phone' | null
  const [otpValue, setOtpValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpErr, setOtpErr] = useState('');

  const openContactOtpFlow = (type) => {
    setOtpTarget(type);
    setOtpValue(type === 'email' ? email : phone);
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('');
    setOtpErr('');
  };

  const handleSendOtp = async () => {
    if (!otpValue || !otpValue.trim()) {
      setOtpErr(`Vui lòng nhập ${otpTarget === 'email' ? 'địa chỉ Email' : 'Số điện thoại'}!`);
      return;
    }
    setOtpLoading(true);
    setOtpErr('');
    setOtpMsg('');
    try {
      const res = await fetch(`${API_URL}/profile/contact/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id || user.id,
          type: otpTarget,
          value: otpValue.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể gửi mã xác thực.');
      setOtpSent(true);
      setOtpMsg(data.message + (data.devOtp ? ` (Mã gợi ý: ${data.devOtp})` : ''));
    } catch (err) {
      setOtpErr(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpErr('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }
    setOtpLoading(true);
    setOtpErr('');
    try {
      const res = await fetch(`${API_URL}/profile/contact/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id || user.id,
          type: otpTarget,
          otpCode: otpCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mã xác thực không hợp lệ.');

      if (otpTarget === 'email') {
        setEmail(otpValue.trim());
        setEmailVerified(true);
      } else {
        setPhone(otpValue.trim());
        setPhoneVerified(true);
      }

      if (data.user) {
        updateUser(data.user);
      }
      setOtpTarget(null);
      alert(`🎉 Đã xác minh ${otpTarget === 'email' ? 'Email' : 'Số điện thoại'} thành công!`);
    } catch (err) {
      setOtpErr(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const newPrivacyStatus = !isPrivate;
    setIsPrivate(newPrivacyStatus);

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id || user.id,
          is_private: newPrivacyStatus
        })
      });

      if (!response.ok) {
        setIsPrivate(!newPrivacyStatus);
        alert('Có lỗi xảy ra khi cập nhật chế độ riêng tư!');
      } else {
        const data = await response.json();
        if (data?.user) {
          updateUser(data.user);
        } else {
          updateUser({ is_private: newPrivacyStatus });
        }
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setIsPrivate(!newPrivacyStatus);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    let finalUserData = null;

    try {
      const textResponse = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          user_id: user.user_id || user.id,
          is_private: isPrivate,
          creator_type: creatorType,
          address,
          hometown,
          age,
          interests,
          email: email.trim() || null,
          phone: phone.trim() || null,
          open_for_collab: openForCollab
        }),
      });
      const textData = await textResponse.json();
      if (!textResponse.ok) throw new Error(textData.message || 'Lỗi cập nhật thông tin');

      finalUserData = textData.user;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('user_id', user.user_id);

        const avatarResponse = await fetch(`${API_URL}/profile/avatar`, {
          method: 'POST',
          body: formData,
        });

        const avatarData = await avatarResponse.json();
        if (!avatarResponse.ok) throw new Error(avatarData.message || 'Lỗi cập nhật avatar');

        finalUserData.profile_photo_url = avatarData.profile_photo_url;
      }

      updateUser(finalUserData);
      onClose();

      if (finalUserData.username !== user.username && navigate) {
        navigate(`/profile/${finalUserData.username}`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Chỉnh sửa trang cá nhân</h2>
          <button type="button" onClick={onClose} className="close-btn" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Change */}
          <div className="avatar-group">
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <img
                src={previewAvatar || user.profile_photo_url || 'https://picsum.photos/100'}
                alt="Avatar"
                className="modal-avatar-preview"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={16} />
              </label>
            </div>
            <label htmlFor="avatar-upload" className="btn-change-avatar">
              Chọn ảnh mới
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Tên người dùng</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* CHỌN LOẠI NHÀ SÁNG TẠO */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Palette size={16} color="#a855f7" />
              <span style={{ fontWeight: '600' }}>Ngành sáng tạo / Loại tài khoản</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '6px',
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              {CREATOR_TYPES.map(({ value, emoji, label, desc }) => {
                const isSelected = (creatorType === value) || (!creatorType && value === null);
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setCreatorType(value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{emoji}</span>
                      <span style={{ fontWeight: '700', fontSize: '12.5px', color: isSelected ? '#60a5fa' : 'var(--text-primary)' }}>
                        {label}
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
                      {desc}
                    </span>
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white'
                      }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              💡 Chọn ngành nghề giúp hồ sơ của bạn nổi bật trên trang Khám Phá và thu hút đúng người theo dõi!
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Tiểu sử cá nhân</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Chia sẻ đôi điều về bạn..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#38bdf8" />
              <span>Nơi ở hiện tại / Địa chỉ</span>
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hometown" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={15} color="#38bdf8" />
              <span>Quê quán</span>
            </label>
            <input
              id="hometown"
              type="text"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              placeholder="Ví dụ: Nghệ An, Nam Định, Hà Nội..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="age" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="#38bdf8" />
              <span>Độ tuổi</span>
            </label>
            <input
              id="age"
              type="number"
              min="10"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ví dụ: 23"
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="#38bdf8" />
              <span>Sở thích</span>
            </label>
            <input
              id="interests"
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Ví dụ: Du lịch, Chụp ảnh, Cà phê, Lập trình (cách nhau bởi dấu phẩy)"
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              💡 Điền nơi ở & sở thích giúp hệ thống gợi ý bạn bè ở gần và có cùng đam mê!
            </span>
          </div>

          {/* THÔNG TIN LIÊN HỆ & XÁC MINH BẢO MẬT (EMAIL & SỐ ĐIỆN THOẠI) */}
          <div style={{
            background: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={18} color="#38bdf8" />
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main, #ffffff)' }}>
                Thông tin liên hệ & Xác thực bảo mật
              </span>
            </div>

            {/* Mục Email */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--bg-card, rgba(0,0,0,0.2))',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Địa chỉ Email
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                    {email ? email : <span style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {email ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: emailVerified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: emailVerified ? '#22c55e' : '#eab308'
                  }}>
                    {emailVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                ) : null}

                {email && !emailVerified && (
                  <button
                    type="button"
                    onClick={() => openContactOtpFlow('email')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #eab308',
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#facc15',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Xác minh ngay
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openContactOtpFlow('email')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #334155)',
                    background: 'transparent',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {email ? 'Đổi Email' : '+ Thêm Email'}
                </button>
              </div>
            </div>

            {/* Mục Số điện thoại */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--bg-card, rgba(0,0,0,0.2))',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399'
                }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Số điện thoại
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main, #ffffff)' }}>
                    {phone ? phone : <span style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {phone ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: phoneVerified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: phoneVerified ? '#22c55e' : '#eab308'
                  }}>
                    {phoneVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {phoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                ) : null}

                {phone && !phoneVerified && (
                  <button
                    type="button"
                    onClick={() => openContactOtpFlow('phone')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #eab308',
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#facc15',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Xác minh ngay
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openContactOtpFlow('phone')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #334155)',
                    background: 'transparent',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {phone ? 'Đổi Số ĐT' : '+ Thêm SĐT'}
                </button>
              </div>
            </div>
          </div>

          {/* CÀI ĐẶT RIÊNG TƯ */}
          <div className="privacy-setting">
            <div className="privacy-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="privacy-label" style={{ fontWeight: '600', fontSize: '14px' }}>Quyền riêng tư của tài khoản:</span>
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`btn-privacy ${isPrivate ? 'private-on' : 'private-off'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isPrivate ? '1px solid #ef4444' : '1px solid #10b981',
                  background: isPrivate ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                  color: isPrivate ? '#f87171' : '#34d399',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                <span>{isPrivate ? '🔒 Riêng tư' : '🌐 Công khai'}</span>
              </button>
            </div>
            <p className="privacy-desc" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {isPrivate
                ? 'Chế độ riêng tư: Chỉ bạn bè được duyệt mới có thể xem bài viết và thông tin chi tiết của bạn.'
                : 'Chế độ công khai: Bất kỳ ai cũng có thể xem hồ sơ và các bài viết của bạn.'}
            </p>
          </div>

          {/* TRẠNG THÁI NHẬN DỰ ÁN / TÌM VIỆC */}
          <div className="privacy-setting" style={{ marginTop: '16px' }}>
            <div className="privacy-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="privacy-label" style={{ fontWeight: '600', fontSize: '14px' }}>Trạng thái nhận dự án & hợp tác:</span>
              <button
                type="button"
                onClick={() => setOpenForCollab(!openForCollab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: openForCollab ? '1px solid #10b981' : '1px solid #64748b',
                  background: openForCollab ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                  color: openForCollab ? '#34d399' : '#94a3b8',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Briefcase size={14} />
                <span>{openForCollab ? '🟢 Đang nhận dự án' : '⚪ Tạm ngưng nhận'}</span>
              </button>
            </div>
            <p className="privacy-desc" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {openForCollab
                ? 'Đang bật: Hồ sơ của bạn sẽ hiển thị trong trang "Tìm & Hợp tác NST" để khách hàng và nhà tuyển dụng kết nối.'
                : 'Đang tắt: Ẩn hồ sơ khỏi danh sách tìm kiếm Nhà Sáng Tạo.'}
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 18px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13.5px'
              }}
            >
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

        {/* MODAL XÁC MINH OTP CHO EMAIL / SĐT */}
        {otpTarget && (
          <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setOtpTarget(null)}>
            <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main, #ffffff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} color="#38bdf8" />
                  <span>Xác thực {otpTarget === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'}</span>
                </h3>
                <button type="button" onClick={() => setOtpTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 14px', lineHeight: '1.4' }}>
                {otpSent 
                  ? `Mã OTP đã được gửi. Vui lòng nhập mã gồm 6 chữ số để xác thực ${otpTarget === 'email' ? 'Email' : 'Số điện thoại'}.`
                  : `Nhập hoặc kiểm tra ${otpTarget === 'email' ? 'Email' : 'Số điện thoại'} bạn muốn xác minh/đổi.`}
              </p>

              {/* Ô nhập thông tin (Email hoặc Số điện thoại) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted, #94a3b8)' }}>
                  {otpTarget === 'email' ? 'Địa chỉ Email:' : 'Số điện thoại:'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={otpTarget === 'email' ? 'email' : 'tel'}
                    value={otpValue}
                    disabled={otpLoading || otpSent}
                    onChange={e => setOtpValue(e.target.value)}
                    placeholder={otpTarget === 'email' ? 'example@gmail.com' : '0912345678'}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #334155)',
                      background: 'var(--bg-surface, #1e293b)',
                      color: 'var(--text-main, #ffffff)',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: otpSent ? 'rgba(56, 189, 248, 0.15)' : '#38bdf8',
                      color: otpSent ? '#38bdf8' : '#0f172a',
                      fontWeight: '700',
                      border: 'none',
                      cursor: otpLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {otpLoading ? 'Đang gửi...' : (otpSent ? 'Gửi lại' : 'Gửi mã OTP')}
                  </button>
                </div>
              </div>

              {/* Thông báo kết quả gửi mã */}
              {otpMsg && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  fontSize: '12.5px',
                  marginBottom: '14px'
                }}>
                  {otpMsg}
                </div>
              )}

              {/* Ô nhập mã OTP */}
              {otpSent && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted, #94a3b8)' }}>
                    Nhập mã xác thực 6 chữ số:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="VD: 123456"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #38bdf8',
                      background: 'rgba(56, 189, 248, 0.05)',
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: '800',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {otpErr && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12.5px',
                  marginBottom: '14px'
                }}>
                  {otpErr}
                </div>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOtpTarget(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #334155)',
                    background: 'transparent',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Đóng
                </button>
                {otpSent && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#22c55e',
                      color: '#ffffff',
                      fontWeight: '700',
                      cursor: (otpLoading || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      opacity: (otpLoading || otpCode.length !== 6) ? 0.6 : 1
                    }}
                  >
                    {otpLoading ? 'Đang xác thực...' : 'Xác nhận & Cập nhật'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditProfileModal;