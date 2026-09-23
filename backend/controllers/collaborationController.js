const { pool } = require('../config/db');

// Lấy danh sách tin tìm kiếm Nhà Sáng Tạo (Hợp tác / Tuyển freelance)
const getCollaborations = async (req, res) => {
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || 'open').trim();
    const query = String(req.query.q || '').trim();

    try {
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            conditions.push(`c.status = $${paramIndex++}`);
            params.push(status);
        }

        if (category && category !== 'all') {
            conditions.push(`c.category ILIKE $${paramIndex++}`);
            params.push(`%${category}%`);
        }

        if (query) {
            conditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
            params.push(`%${query}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                c.id, c.user_id, c.title, c.category, c.budget, c.deadline, 
                c.job_type, c.description, c.skills_required, c.status, 
                c.contact_info, COALESCE(c.views_count, 0) AS views_count, c.created_at,
                u.username, u.profile_photo_url, (u.is_verified IS TRUE) AS is_verified
            FROM creator_collaborations c
            JOIN users u ON u.user_id = c.user_id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT 50
        `;

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi getCollaborations:', err);
        res.status(500).json({ message: 'Không thể lấy danh sách tin hợp tác.', error: err.message });
    }
};

// Đăng tin tìm kiếm Nhà Sáng Tạo mới
const createCollaboration = async (req, res) => {
    const {
        user_id,
        title,
        category,
        budget,
        deadline,
        job_type = 'freelance',
        description,
        skills_required = [],
        contact_info
    } = req.body;

    if (!user_id || !title || !category || !description) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ tiêu đề, lĩnh vực và mô tả công việc.' });
    }

    try {
        const skillsJson = Array.isArray(skills_required) 
            ? JSON.stringify(skills_required) 
            : (typeof skills_required === 'string' ? skills_required : '[]');

        const result = await pool.query(
            `INSERT INTO creator_collaborations (
                user_id, title, category, budget, deadline,
                job_type, description, skills_required, contact_info, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW())
            RETURNING *`,
            [
                user_id,
                title.trim(),
                category.trim(),
                budget ? budget.trim() : 'Thỏa thuận',
                deadline ? deadline.trim() : 'Linh hoạt',
                job_type,
                description.trim(),
                skillsJson,
                contact_info || null
            ]
        );

        res.status(201).json({ message: 'Đăng tin tìm Nhà Sáng Tạo thành công!', collaboration: result.rows[0] });
    } catch (err) {
        console.error('Lỗi createCollaboration:', err);
        res.status(500).json({ message: 'Không thể đăng tin hợp tác.', error: err.message });
    }
};

// Đóng tin tuyển dụng / cập nhật trạng thái
const updateCollaborationStatus = async (req, res) => {
    const { id } = req.params;
    const { user_id, status } = req.body;

    try {
        const check = await pool.query('SELECT user_id FROM creator_collaborations WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
        }

        if (Number(check.rows[0].user_id) !== Number(user_id)) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tin này.' });
        }

        const result = await pool.query(
            'UPDATE creator_collaborations SET status = $1 WHERE id = $2 RETURNING *',
            [status || 'closed', id]
        );

        res.json({ message: 'Cập nhật trạng thái thành công!', collaboration: result.rows[0] });
    } catch (err) {
        console.error('Lỗi updateCollaborationStatus:', err);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái.', error: err.message });
    }
};

module.exports = {
    getCollaborations,
    createCollaboration,
    updateCollaborationStatus
};
