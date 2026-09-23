import React from 'react';
import { X, Briefcase, DollarSign, Clock, MapPin, CheckCircle, Send } from 'lucide-react';

const CREATIVE_JOBS = [
  {
    id: 1,
    title: 'Senior UI/UX Designer (FinTech & Web3 App)',
    client: 'FinVenture Studio',
    budget: '28.000.000 - 45.000.000 VNĐ',
    type: 'Toàn thời gian (Remote)',
    deadline: 'Còn 5 ngày',
    location: 'Hà Nội / Remote',
    tags: ['UI/UX', 'Figma', 'FinTech', 'Design System'],
    description: 'Cần tìm 1 Senior UI/UX Designer phụ trách thiết kế trải nghiệm người dùng toàn diện cho ứng dụng quản lý tài chính và ví điện tử thế hệ mới.',
    clientId: 1,
    clientUsername: 'admin'
  },
  {
    id: 2,
    title: 'Thiết kế 3D Motion Graphic Video 60s cho TVC',
    client: 'Glow Creative Agency',
    budget: '18.000.000 - 25.000.000 VNĐ',
    type: 'Freelance / Hợp đồng dự án',
    deadline: 'Còn 3 ngày',
    location: 'TP. Hồ Chí Minh',
    tags: ['3D Art', 'Blender', 'Cinema 4D', 'After Effects'],
    description: 'Dự án dựng video 3D visual động 60 giây giới thiệu dòng nước hoa cao cấp cho chiến dịch mùa thu đông.',
    clientId: 2,
    clientUsername: 'glow_creative'
  },
  {
    id: 3,
    title: 'Bộ nhận diện thương hiệu Visual Identity cho chuỗi cà phê',
    client: 'The Green Leaf Coffee',
    budget: '15.000.000 - 20.000.000 VNĐ',
    type: 'Freelance theo mốc bàn giao',
    deadline: 'Còn 1 tuần',
    location: 'Đà Nẵng / Remote',
    tags: ['Branding', 'Logo', 'Illustrator', 'Bao bì'],
    description: 'Xây dựng Brand Guidelines, Logo vector, Menu, cốc và bao bì sản phẩm theo phong cách tối giản xanh hiện đại.',
    clientId: 3,
    clientUsername: 'green_leaf'
  },
  {
    id: 4,
    title: 'Họa sĩ Minh họa 2D (Illustration Artist) cho Game Mobile',
    client: 'PixelForge Interactive',
    budget: '22.000.000 - 32.000.000 VNĐ',
    type: 'Toàn thời gian / Bán thời gian',
    deadline: 'Còn 10 ngày',
    location: 'Remote',
    tags: ['Minh họa', 'Photoshop', 'Game Art', 'Concept Art'],
    description: 'Thiết kế nhân vật, background 2D và item cho tựa game casual phong cách fantasy phát hành quốc tế.',
    clientId: 4,
    clientUsername: 'pixelforge'
  }
];

export default function CreativeJobsModal({ onClose }) {
  const handleApplyJob = (job) => {
    localStorage.setItem('activeChatUser', JSON.stringify({
      user_id: job.clientId,
      username: job.clientUsername
    }));
    window.dispatchEvent(new Event('open-chat'));
    onClose();
  };

  return (
    <div className="behance-modal-overlay" onClick={onClose}>
      <div
        className="creative-jobs-modal-container"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="creative-jobs-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="jobs-icon-badge">
              <Briefcase size={22} color="#34d399" />
            </div>
            <div>
              <h2 className="jobs-modal-title">Cơ hội việc làm & Dự án Sáng tạo</h2>
              <p className="jobs-modal-sub">Kết nối trực tiếp nhà tuyển dụng và các Freelancer / Creator trên NovaGen</p>
            </div>
          </div>
          <button
            type="button"
            className="jobs-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="creative-jobs-modal-body">
          <div className="creative-jobs-grid">
            {CREATIVE_JOBS.map(job => (
              <div key={job.id} className="creative-job-fullcard">
                <div className="job-fullcard-top">
                  <div className="job-fullcard-meta">
                    <span className="job-company-name">{job.client}</span>
                    <h3 className="job-main-title">{job.title}</h3>
                  </div>
                  <div className="job-budget-badge">
                    <DollarSign size={14} style={{ display: 'inline', marginRight: '2px' }} />
                    {job.budget}
                  </div>
                </div>

                <p className="job-description-text">{job.description}</p>

                <div className="job-details-chips">
                  <span className="job-info-chip">
                    <MapPin size={13} />
                    {job.location}
                  </span>
                  <span className="job-info-chip">
                    <Clock size={13} />
                    {job.deadline}
                  </span>
                  <span className="job-info-chip">
                    <CheckCircle size={13} />
                    {job.type}
                  </span>
                </div>

                <div className="job-tags-row">
                  {job.tags.map(tag => (
                    <span key={tag} className="job-tag-badge">#{tag}</span>
                  ))}
                </div>

                <div className="job-card-action-bar">
                  <button
                    type="button"
                    className="btn-apply-now"
                    onClick={() => handleApplyJob(job)}
                  >
                    <Send size={15} />
                    <span>Nhắn tin ứng tuyển / Báo giá ngay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
