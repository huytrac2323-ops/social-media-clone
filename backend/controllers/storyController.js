const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const createStory = async (req, res) => {
    const { user_id } = req.body;
    if (!user_id || !req.file) {
        return res.status(400).json({ message: 'Cần có user_id và ảnh/video.' });
    }

    try {
        const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        let mediaUrl = `/uploads/${req.file.filename}`;
        const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME
            && process.env.CLOUDINARY_API_KEY
            && process.env.CLOUDINARY_API_SECRET;
        if (hasCloudinaryConfig) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'social-media-clone-stories',
                resource_type: 'auto'
            });
            mediaUrl = uploadResult.secure_url;
            fs.unlinkSync(req.file.path);
        }
        let poll = null;
        if (req.body.poll) {
            try {
                poll = JSON.parse(req.body.poll);
                if (!poll.question || !Array.isArray(poll.options) || poll.options.length < 2) {
                    return res.status(400).json({ message: 'Poll cần câu hỏi và ít nhất 2 lựa chọn.' });
                }
            } catch {
                return res.status(400).json({ message: 'Dữ liệu poll không hợp lệ.' });
            }
        }
        const result = await pool.query(
            `INSERT INTO stories (user_id, media_url, media_type, poll, sticker, expires_at)
             VALUES ($1, $2, $3, $4::jsonb, $5, NOW() + INTERVAL '24 hours')
             RETURNING story_id, user_id, media_url, media_type, poll, sticker, created_at, expires_at`,
            [user_id, mediaUrl, mediaType, poll ? JSON.stringify(poll) : null, req.body.sticker || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Không thể đăng story.', error: err.message });
    }
};

const getStories = async (req, res) => {
    const viewerId = req.query.userId || null;
    try {
        const result = await pool.query(
            `SELECT s.story_id, s.user_id, s.media_url, s.media_type, s.poll, s.sticker,
                    s.created_at, s.expires_at,
                    (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) AS view_count,
                    COALESCE((
                        SELECT jsonb_object_agg(v.option_value, v.vote_count)
                        FROM (
                            SELECT option_value, COUNT(*)::int AS vote_count
                            FROM story_poll_votes
                            WHERE story_id = s.story_id
                            GROUP BY option_value
                        ) v
                    ), '{}'::jsonb) AS poll_votes,
                    u.username, u.profile_photo_url
             FROM stories s
             JOIN users u ON u.user_id = s.user_id
             WHERE s.expires_at > NOW()
               AND (
                 u.is_private IS NOT TRUE
                 OR u.user_id = $1
                 OR EXISTS (
                   SELECT 1 FROM friends f
                   WHERE f.status = 'accepted'
                     AND ((f.user_id = $1 AND f.friend_id = u.user_id)
                       OR (f.user_id = u.user_id AND f.friend_id = $1))
                 )
               )
             ORDER BY s.created_at DESC`,
            [viewerId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Không thể tải story.', error: err.message });
    }
};

const viewStory = async (req, res) => {
    const viewerId = req.body.user_id;
    const { storyId } = req.params;
    if (!viewerId) return res.status(400).json({ message: 'Thiếu người xem story.' });
    try {
        await pool.query(
            'INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [storyId, viewerId]
        );
        res.json({ message: 'Đã ghi nhận lượt xem.' });
    } catch (err) {
        res.status(500).json({ message: 'Không thể ghi nhận lượt xem.', error: err.message });
    }
};

const reactToStory = async (req, res) => {
    const { storyId } = req.params;
    const { user_id: userId, reaction } = req.body;
    const allowedReactions = ['❤️', '😂', '😮', '😢', '👏', '🔥'];
    if (!userId || !allowedReactions.includes(reaction)) return res.status(400).json({ message: 'Reaction không hợp lệ.' });

    try {
        await pool.query(
            `INSERT INTO story_reactions (story_id, user_id, reaction)
             VALUES ($1, $2, $3)
             ON CONFLICT (story_id, user_id)
             DO UPDATE SET reaction = EXCLUDED.reaction, reacted_at = NOW()`,
            [storyId, userId, reaction]
        );
        res.json({ message: 'Đã thả reaction.', reaction });
    } catch (err) {
        res.status(500).json({ message: 'Không thể thả reaction.', error: err.message });
    }
};

module.exports = { createStory, getStories, viewStory, reactToStory };
