const { pool } = require('../config/db');

const search = async (req, res) => {
    const query = String(req.query.q || '').trim();
    const viewerId = req.query.userId || null;
    const type = String(req.query.type || 'all');
    const location = String(req.query.location || '').trim();
    const sort = req.query.sort === 'oldest' ? 'ASC' : 'DESC';

    if (query.length < 2) {
        return res.json({ users: [], posts: [] });
    }

    const pattern = `%${query}%`;
    try {
        const users = await pool.query(
            `SELECT user_id, username, profile_photo_url, is_private, creator_type, bio
             FROM users
             WHERE username ILIKE $1
             ORDER BY username
             LIMIT 20`,
            [pattern]
        );

        const searchTerm = query.startsWith('#') ? query.slice(1) : query;
        const posts = await pool.query(
            `SELECT p.post_id, p.caption, p.photo_url, p.created_at,
                    p.location, u.user_id, u.username, u.profile_photo_url
             FROM post p
             JOIN users u ON u.user_id = p.user_id
             WHERE (
                    p.caption ILIKE $1
                    OR p.location ILIKE $1
                    OR p.caption ~* $3
                   )
               AND ($4 = '' OR p.location ILIKE $5)
               AND (
                 u.is_private IS NOT TRUE
                 OR u.user_id = $2
                 OR EXISTS (
                   SELECT 1 FROM friends f
                   WHERE f.status = 'accepted'
                     AND ((f.user_id = $2 AND f.friend_id = u.user_id)
                       OR (f.user_id = u.user_id AND f.friend_id = $2))
                 )
               )
             ORDER BY p.created_at ${sort}
             LIMIT 40`,
            [pattern, viewerId, `(^|\\s)#${searchTerm}(\\s|$)`, type === 'location' ? location : '', `%${location}%`]
        );

        res.json({ users: type === 'posts' || type === 'location' ? [] : users.rows, posts: type === 'users' ? [] : posts.rows });
    } catch (err) {
        res.status(500).json({ message: 'Không thể tìm kiếm.', error: err.message });
    }
};

// Lấy danh sách nhà sáng tạo theo loại ngành
const getCreators = async (req, res) => {
    const creatorType = req.query.type || null;
    const limit = parseInt(req.query.limit) || 20;

    try {
        let queryStr, params;
        if (creatorType && creatorType !== 'all') {
            queryStr = `
                SELECT user_id, username, profile_photo_url, bio, creator_type, is_verified,
                       (SELECT COUNT(*) FROM follows WHERE followee_id = users.user_id) AS follower_count,
                       (SELECT COUNT(*) FROM post WHERE user_id = users.user_id) AS post_count
                FROM users
                WHERE creator_type = $1
                ORDER BY follower_count DESC, created_at DESC
                LIMIT $2
            `;
            params = [creatorType, limit];
        } else {
            queryStr = `
                SELECT user_id, username, profile_photo_url, bio, creator_type, is_verified,
                       (SELECT COUNT(*) FROM follows WHERE followee_id = users.user_id) AS follower_count,
                       (SELECT COUNT(*) FROM post WHERE user_id = users.user_id) AS post_count
                FROM users
                WHERE creator_type IS NOT NULL
                ORDER BY follower_count DESC, created_at DESC
                LIMIT $1
            `;
            params = [limit];
        }

        const result = await pool.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Không thể lấy danh sách nhà sáng tạo.', error: err.message });
    }
};

// Cập nhật creator_type cho người dùng
const updateCreatorType = async (req, res) => {
    const { user_id, creator_type } = req.body;
    if (!user_id) return res.status(400).json({ message: 'Thiếu user_id.' });

    try {
        await pool.query(
            'UPDATE users SET creator_type = $1 WHERE user_id = $2',
            [creator_type || null, user_id]
        );
        res.json({ message: 'Cập nhật thành công!', creator_type });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

module.exports = { search, getCreators, updateCreatorType };
