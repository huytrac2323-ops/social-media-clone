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
            `SELECT user_id, username, profile_photo_url, is_private
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

module.exports = { search };
