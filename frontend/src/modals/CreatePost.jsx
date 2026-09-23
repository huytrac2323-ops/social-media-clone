import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import {
  Image as ImageIcon,
  MapPin,
  X,
  Send,
  Sparkles,
  Layers,
  Wrench,
  Plus,
  Trash2,
  UploadCloud,
  FileText
} from 'lucide-react';
import { safeFetch } from '../utils/api';

const POPULAR_TOOLS = [
  'Figma',
  'Photoshop',
  'Illustrator',
  'Blender',
  'Cinema 4D',
  'After Effects',
  'Procreate',
  'Lightroom',
  'Premiere Pro',
  'Midjourney',
  'Canva'
];

const PORTFOLIO_CATEGORIES = [
  'Thiết kế đồ họa',
  'UI/UX Design',
  'Minh họa & Art',
  '3D & Hoạt hình',
  'Nhiếp ảnh',
  'Branding & Logo',
  'Kiến trúc',
  'Khác'
];

function CreatePost({ onPostCreated, defaultMode = 'social' }) {
  const { currentUser } = useAuth();

  // Tab: 'social' (Trạng thái nhanh) | 'portfolio' (Đăng Dự án)
  const [activeTab, setActiveTab] = useState(defaultMode || 'social');

  // --- SOCIAL MODE STATE ---
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);

  // --- PORTFOLIO MODE STATE ---
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('Thiết kế đồ họa');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [caseStudySteps, setCaseStudySteps] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [customToolInput, setCustomToolInput] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Xử lý chọn ảnh đơn (Social)
  const handleSocialImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveSocialImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xử lý chọn ảnh bìa (Portfolio)
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // Thêm một bước/ảnh mới vào Case Study
  const handleAddCaseStudyStep = () => {
    setCaseStudySteps(prev => [
      ...prev,
      { id: Date.now(), file: null, preview: null, caption: '' }
    ]);
  };

  const handleStepFileChange = (id, file) => {
    if (!file) return;
    setCaseStudySteps(prev =>
      prev.map(step =>
        step.id === id
          ? { ...step, file, preview: URL.createObjectURL(file) }
          : step
      )
    );
  };

  const handleStepCaptionChange = (id, caption) => {
    setCaseStudySteps(prev =>
      prev.map(step => (step.id === id ? { ...step, caption } : step))
    );
  };

  const handleRemoveStep = (id) => {
    setCaseStudySteps(prev => prev.filter(step => step.id !== id));
  };

  // Toggle công cụ sử dụng
  const handleToggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(prev => prev.filter(t => t !== tool));
    } else {
      setSelectedTools(prev => [...prev, tool]);
    }
  };

  const handleAddCustomTool = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = customToolInput.trim();
      if (trimmed && !selectedTools.includes(trimmed)) {
        setSelectedTools(prev => [...prev, trimmed]);
        setCustomToolInput('');
      }
    }
  };

  // Gửi bài đăng
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để đăng bài.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('user_id', currentUser.user_id);

    if (activeTab === 'social') {
      if (!inputText.trim() && !imageFile) {
        setIsSubmitting(false);
        return;
      }
      formData.append('post_type', 'social');
      formData.append('caption', inputText.trim());
      if (location.trim()) formData.append('location', location.trim());
      if (imageFile) formData.append('postImage', imageFile);
    } else {
      // Portfolio Mode
      if (!projectTitle.trim()) {
        alert('Vui lòng nhập Tiêu đề dự án!');
        setIsSubmitting(false);
        return;
      }
      if (!coverFile) {
        alert('Vui lòng chọn Ảnh Bìa (Cover) cho dự án!');
        setIsSubmitting(false);
        return;
      }

      formData.append('post_type', 'portfolio');
      formData.append('title', projectTitle.trim());
      formData.append('category', projectCategory);
      formData.append('caption', portfolioDescription.trim());
      formData.append('tools_used', JSON.stringify(selectedTools));
      formData.append('postImage', coverFile);

      // Đính kèm các ảnh và mô tả trong Case Study
      const stepMetadata = [];
      caseStudySteps.forEach((step) => {
        if (step.file) {
          formData.append('projectImages', step.file);
          stepMetadata.push({ caption: step.caption.trim() });
        }
      });
      formData.append('project_images', JSON.stringify(stepMetadata));
    }

    try {
      const response = await safeFetch('/posts', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi đăng bài');
      }

      // Reset toàn bộ form
      setInputText('');
      setLocation('');
      setShowLocationInput(false);
      handleRemoveSocialImage();

      setProjectTitle('');
      setCoverFile(null);
      setCoverPreview(null);
      setCaseStudySteps([]);
      setSelectedTools([]);
      setPortfolioDescription('');

      if (onPostCreated) onPostCreated();
    } catch (error) {
      alert(`Đăng bài thất bại!\n\nLỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="composer-dual-card">
      {/* 1. THANH CHUYỂN ĐỔI 2 TAB (SOCIAL MODE VS PORTFOLIO MODE) */}
      <div className="composer-tabs-header">
        <button
          type="button"
          className={`composer-tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <Sparkles size={16} />
          <span>⚡ Trạng thái nhanh</span>
        </button>

        <button
          type="button"
          className={`composer-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <Layers size={16} />
          <span>🎨 Đăng Dự án (Portfolio)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TRẠNG THÁI NHANH (SOCIAL MODE)                    */}
      {/* ======================================================== */}
      {activeTab === 'social' && (
        <form onSubmit={handleSubmit} className="social-composer-form">
          <div className="composer-user-row">
            <Avatar user={currentUser} size={40} />
            <div>
              <div className="composer-username">{currentUser.username}</div>
              <div className="composer-subtitle">Cập nhật nhanh tiến độ, suy nghĩ</div>
            </div>
          </div>

          <textarea
            placeholder={`Bạn đang nghĩ gì thế, ${currentUser.username}?`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            className="composer-textarea"
          />

          {showLocationInput && (
            <div className="composer-location-row">
              <MapPin size={16} color="#3b82f6" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Thêm địa điểm..."
                className="composer-sub-input"
              />
            </div>
          )}

          {previewUrl && (
            <div className="composer-preview-box">
              <img src={previewUrl} alt="Xem trước" />
              <button
                type="button"
                onClick={handleRemoveSocialImage}
                className="composer-remove-btn"
                aria-label="Xóa ảnh"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="composer-footer-row">
            <div className="composer-left-actions">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleSocialImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="composer-action-pill"
              >
                <ImageIcon size={16} color="#60a5fa" />
                <span>Ảnh/Video</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLocationInput(!showLocationInput)}
                className={`composer-action-pill ${showLocationInput ? 'active' : ''}`}
              >
                <MapPin size={16} color="#34d399" />
                <span>Vị trí</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!inputText.trim() && !imageFile)}
              className="composer-submit-btn"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Đang đăng...' : 'Đăng bài'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ĐĂNG DỰ ÁN PORTFOLIO (PORTFOLIO MODE)             */}
      {/* ======================================================== */}
      {activeTab === 'portfolio' && (
        <form onSubmit={handleSubmit} className="portfolio-composer-form">
          {/* Tiêu đề dự án & Thể loại */}
          <div className="portfolio-form-grid">
            <div className="portfolio-field">
              <label className="portfolio-label">Tiêu đề dự án *</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="VD: Redesign Brand Identity & Web App cho EcoCoffee..."
                className="portfolio-input"
                required
              />
            </div>

            <div className="portfolio-field">
              <label className="portfolio-label">Thể loại tác phẩm</label>
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                className="portfolio-select"
              >
                {PORTFOLIO_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload Ảnh Bìa (Cover Photo - Bắt buộc cho Grid Feed) */}
          <div className="portfolio-field">
            <label className="portfolio-label">
              Ảnh Bìa Dự Án (Cover Photo) *
              <span className="label-hint"> — Hiển thị nổi bật trên Grid Feed Behance</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              ref={coverInputRef}
              style={{ display: 'none' }}
            />

            {coverPreview ? (
              <div className="portfolio-cover-preview">
                <img src={coverPreview} alt="Ảnh bìa" />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="composer-remove-btn"
                  title="Đổi ảnh bìa khác"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="portfolio-upload-dropzone"
                onClick={() => coverInputRef.current.click()}
              >
                <UploadCloud size={32} color="#60a5fa" />
                <div className="dropzone-text">Nhấp để tải lên Ảnh Bìa dự án (PNG, JPG, WebP)</div>
                <div className="dropzone-sub">Tỉ lệ khuyến nghị 16:9 hoặc 4:3 độ phân giải cao</div>
              </div>
            )}
          </div>

          {/* Mô tả tổng quan Case Study */}
          <div className="portfolio-field">
            <label className="portfolio-label">Mô tả dự án & ý tưởng sáng tạo</label>
            <textarea
              rows={3}
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              placeholder="Chia sẻ về bối cảnh dự án, bài toán thiết kế, thông điệp truyền tải..."
              className="portfolio-textarea"
            />
          </div>

          {/* Trình thêm nhiều ảnh Case Study kèm chú thích quá trình */}
          <div className="portfolio-field">
            <div className="portfolio-steps-header">
              <label className="portfolio-label" style={{ marginBottom: 0 }}>
                Chi tiết Case Study (Ảnh các bước thực hiện)
              </label>
              <button
                type="button"
                className="portfolio-add-step-btn"
                onClick={handleAddCaseStudyStep}
              >
                <Plus size={14} />
                <span>Thêm bước / ảnh</span>
              </button>
            </div>

            {caseStudySteps.length > 0 && (
              <div className="portfolio-steps-list">
                {caseStudySteps.map((step, idx) => (
                  <div key={step.id} className="portfolio-step-card">
                    <div className="step-header">
                      <span className="step-number">Giai đoạn {idx + 1}</span>
                      <button
                        type="button"
                        className="step-delete-btn"
                        onClick={() => handleRemoveStep(step.id)}
                        title="Xóa giai đoạn này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="step-body">
                      {step.preview ? (
                        <div className="step-img-preview">
                          <img src={step.preview} alt={`Giai đoạn ${idx + 1}`} />
                          <button
                            type="button"
                            onClick={() => handleStepFileChange(step.id, null)}
                            className="composer-remove-btn"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="step-upload-label">
                          <ImageIcon size={20} />
                          <span>Tải ảnh giai đoạn này</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleStepFileChange(step.id, e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}

                      <input
                        type="text"
                        value={step.caption}
                        onChange={(e) => handleStepCaptionChange(step.id, e.target.value)}
                        placeholder="Mô tả công việc (VD: Bản vẽ phác thảo wireframe, moodboard màu sắc...)"
                        className="portfolio-input step-caption-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Công cụ đã sử dụng (Tools Used) */}
          <div className="portfolio-field">
            <label className="portfolio-label">
              <Wrench size={15} style={{ display: 'inline', marginRight: '6px' }} />
              Công cụ đã sử dụng (Tools)
            </label>
            <div className="portfolio-tools-chips">
              {POPULAR_TOOLS.map(tool => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => handleToggleTool(tool)}
                    className={`tool-chip ${isSelected ? 'active' : ''}`}
                  >
                    {isSelected && '✓ '}
                    {tool}
                  </button>
                );
              })}
            </div>

            <div className="portfolio-custom-tool-row">
              <input
                type="text"
                value={customToolInput}
                onChange={(e) => setCustomToolInput(e.target.value)}
                onKeyDown={handleAddCustomTool}
                placeholder="Thêm công cụ khác (gõ tên rồi nhấn Enter)..."
                className="portfolio-input"
              />
              <button
                type="button"
                onClick={handleAddCustomTool}
                className="tool-add-btn"
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Nút Xuất bản Portfolio */}
          <div className="portfolio-submit-bar">
            <button
              type="submit"
              disabled={isSubmitting || !projectTitle.trim() || !coverFile}
              className="portfolio-publish-btn"
            >
              <Layers size={16} />
              <span>{isSubmitting ? 'Đang xuất bản dự án...' : 'Xuất bản Dự án Portfolio'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreatePost;