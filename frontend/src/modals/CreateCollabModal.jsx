import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { safeFetch } from '../utils/api';
import {
  X,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'Figma', 'UI/UX', 'Photoshop', 'Illustrator', 'Blender', '3D Max',
  'After Effects', 'Premiere Pro', 'Motion Graphics', 'Typography',
  'Logo Design', 'Branding', 'Drawing', 'React', 'HTML/CSS'
];

export default function CreateCollabModal({ isOpen, onClose, onCreated }) {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('UI/UX Design');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [jobType, setJobType] = useState('freelance');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState(['Figma', 'UI/UX']);
  const [customSkill, setCustomSkill] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = (skillName) => {
    if (!skills.includes(skillName)) {
      setSkills([...skills, skillName]);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề tìm kiếm Nhà Sáng Tạo.');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả chi tiết yêu cầu công việc.');
      return;
    }

    setLoading(true);
    try {
      const myId = currentUser?.user_id || currentUser?.id;
      const res = await safeFetch('/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: myId,
          title: title.trim(),
          category,
          budget: budget.trim() || 'Thỏa thuận',
          deadline: deadline.trim() || 'Linh hoạt',
          job_type: jobType,
          description: description.trim(),
          skills_required: skills,
          contact_info: contactInfo.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể đăng tin tuyển dụng.');
      }

      if (onCreated) onCreated(data.collaboration);
      onClose();
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content modal-collab-create"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '92%',
          background: 'var(--bg-card, #121826)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '20px',
          padding: '24px 28px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Đăng Tin Tìm Kiếm Nhà Sáng Tạo
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Kết nối với các Creator, Designer, Freelancer phù hợp nhất với dự án của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tiêu đề */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Tiêu đề tìm kiếm <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Cần tìm UI/UX Designer thiết kế Mobile App tài chính..."
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '10px',
                border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none'
              }}
              required
            />
          </div>

          {/* Lĩnh vực & Hình thức */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Lĩnh vực cần hợp tác <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="UI/UX Design">UI/UX Design (Web & Mobile)</option>
                <option value="Đồ họa & Thương hiệu">Đồ họa & Thương hiệu (Branding, Logo)</option>
                <option value="3D & Motion Graphics">3D Art & Motion Graphics</option>
                <option value="Minh họa & Art">Minh họa (Illustration, Painting)</option>
                <option value="Làm Video & Editor">Làm Video & Video Editing</option>
                <option value="Nhiếp ảnh">Nhiếp ảnh (Photography)</option>
                <option value="Lập trình & Tech">Lập trình Web & Frontend</option>
                <option value="Khác">Lĩnh vực sáng tạo khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Hình thức làm việc
              </label>
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="freelance">Freelance theo dự án</option>
                <option value="remote">Remote / Làm việc từ xa</option>
                <option value="part-time">Bán thời gian (Part-time)</option>
                <option value="full-time">Toàn thời gian (Full-time)</option>
                <option value="contract">Hợp đồng dài hạn</option>
              </select>
            </div>
          </div>

          {/* Ngân sách & Thời hạn */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Ngân sách dự kiến
              </label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Ví dụ: 8 - 15 triệu, hoặc 500k/bài..."
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Thời hạn hoàn thành
              </label>
              <input
                type="text"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                placeholder="Ví dụ: Trong 2 tuần, Cần gấp 3 ngày..."
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Kỹ năng yêu cầu (Tags) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Kỹ năng & Công cụ mong muốn
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {skills.map(s => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px',
                    background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)',
                    color: '#60a5fa', fontSize: '12px', fontWeight: '600'
                  }}
                >
                  #{s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                placeholder="Thêm kỹ năng khác (Enter để thêm)..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill(e);
                  }
                }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                style={{
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                + Thêm
              </button>
            </div>

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
              {SUGGESTED_SKILLS.slice(0, 8).map(sk => (
                <button
                  type="button"
                  key={sk}
                  onClick={() => handleAddSkill(sk)}
                  style={{
                    padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)',
                    background: 'transparent', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer'
                  }}
                >
                  +{sk}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả chi tiết yêu cầu */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Mô tả chi tiết yêu cầu & quyền lợi <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả bối cảnh dự án, các đầu việc cần làm, tiêu chí hoàn thành, phong cách mong muốn, v.v..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1px solid var(--border-subtle)', background: 'var(--bg-input, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none', resize: 'vertical', lineHeight: 1.5
              }}
              required
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: '10px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
              }}
            >
              {loading ? 'Đang đăng tin...' : 'Đăng tin tìm NST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
