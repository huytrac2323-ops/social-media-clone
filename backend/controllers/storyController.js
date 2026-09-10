const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { createNotification } = require('./NotificationController');

const getUploadedFile = (req, fieldName) => req.files?.[fieldName]?.[0] || null;

const uploadStoryAsset = async (file, folder) => {
    if (!file) return null;
    const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME
        && process.env.CLOUDINARY_API_KEY
        && process.env.CLOUDINARY_API_SECRET;
    if (!hasCloudinaryConfig) return `/uploads/${file.filename}`;

    const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto'
    });
    fs.unlinkSync(file.path);
    return uploadResult.secure_url;
};

const removeLocalUpload = mediaUrl => {
    if (!mediaUrl?.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '../public', mediaUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const cleanupUploadedFiles = req => {
    Object.values(req.files || {}).flat().forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
};

const isMp3File = file => file
    && (file.mimetype === 'audio/mpeg' || path.extname(file.originalname).toLowerCase() === '.mp3');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const createStory = async (req, res) => {
    const { user_id } = req.body;
    const storyMedia = getUploadedFile(req, 'storyMedia');
    const storyMusic = getUploadedFile(req, 'storyMusic');
    const spotifyTrackId = req.body.spotify_track_id || null;
    const sharedPostId = req.body.shared_post_id || null;
    if (!user_id || (!storyMedia && !sharedPostId && !req.body.sticker)) {
        return res.status(400).json({ message: 'Cần chọn ảnh/video, bài viết hoặc văn bản để đăng Story.' });
    }
    if (storyMusic && !isMp3File(storyMusic)) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ message: 'Nhạc Story phải là tệp MP3.' });
    }

    try {
        if (sharedPostId) {
            const sharedPost = await pool.query('SELECT post_id FROM post WHERE post_id = $1', [sharedPostId]);
            if (sharedPost.rowCount === 0) {
                cleanupUploadedFiles(req);
                return res.status(404).json({ message: 'Không tìm thấy bài viết được chọn.' });
            }
        }

        const mediaType = storyMedia ? (storyMedia.mimetype.startsWith('video/') ? 'video' : 'image') : null;
        const mediaUrl = await uploadStoryAsset(storyMedia, 'social-media-clone-stories');
        const uploadedMusic = await uploadStoryAsset(storyMusic, 'social-media-clone-story-music');
        const musicUrl = uploadedMusic || req.body.music_url || null;
        const musicName = storyMusic?.originalname
            || req.body.music_name
            || (req.body.spotify_track_name ? `${req.body.spotify_track_name} - ${req.body.spotify_artist_name || ''}` : null);
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
            `INSERT INTO stories (
                user_id, media_url, media_type, poll, sticker, music_url, music_name,
                spotify_track_id, spotify_track_name, spotify_artist_name, spotify_external_url,
                shared_post_id, expires_at
             )
             VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, NOW() + INTERVAL '24 hours')
             RETURNING story_id, user_id, media_url, media_type, poll, sticker, music_url, music_name,
                       spotify_track_id, spotify_track_name, spotify_artist_name, spotify_external_url,
                       shared_post_id, created_at, expires_at`,
            [
                user_id,
                mediaUrl,
                mediaType,
                poll ? JSON.stringify(poll) : null,
                req.body.sticker || null,
                musicUrl,
                musicName,
                spotifyTrackId,
                req.body.spotify_track_name || null,
                req.body.spotify_artist_name || null,
                req.body.spotify_external_url || null,
                sharedPostId
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        cleanupUploadedFiles(req);
        res.status(500).json({ message: 'Không thể đăng story.', error: err.message });
    }
};

const getStories = async (req, res) => {
    const viewerId = req.query.userId || null;
    if (!viewerId) {
        // Khách chưa đăng nhập không thể xem story cá nhân
        return res.json([]);
    }
    try {
        const result = await pool.query(
            `SELECT s.story_id, s.user_id, s.media_url, s.media_type, s.poll, s.sticker,
                    s.music_url, s.music_name, s.spotify_track_id, s.spotify_track_name,
                    s.spotify_artist_name, s.spotify_external_url, s.shared_post_id,
                    CASE WHEN sp.post_id IS NULL THEN NULL ELSE json_build_object(
                        'post_id', sp.post_id,
                        'caption', sp.caption,
                        'photo_url', sp.photo_url,
                        'created_at', sp.created_at,
                        'username', spu.username,
                        'profile_photo_url', spu.profile_photo_url
                    ) END AS shared_post,
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
                    u.username, u.profile_photo_url, (u.is_verified IS TRUE) AS is_verified
             FROM stories s
             JOIN users u ON u.user_id = s.user_id
             LEFT JOIN post sp ON sp.post_id = s.shared_post_id
             LEFT JOIN users spu ON spu.user_id = sp.user_id
             WHERE s.expires_at > NOW()
               AND (
                 s.user_id = $1
                 OR EXISTS (
                   SELECT 1 FROM friends f
                   WHERE f.status = 'accepted'
                     AND ((f.user_id = $1 AND f.friend_id = s.user_id)
                       OR (f.user_id = s.user_id AND f.friend_id = $1))
                 )
                 OR EXISTS (
                   SELECT 1 FROM follows fl
                   WHERE fl.follower_id = $1 AND fl.followee_id = s.user_id
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
        const storyOwner = await pool.query('SELECT user_id FROM stories WHERE story_id = $1', [storyId]);
        await createNotification({
            receiverId: storyOwner.rows[0]?.user_id,
            senderId: userId,
            type: 'story_reaction',
            content: `đã thả ${reaction} vào story của bạn.`
        });
        res.json({ message: 'Đã thả reaction.', reaction });
    } catch (err) {
        res.status(500).json({ message: 'Không thể thả reaction.', error: err.message });
    }
};

const updateStory = async (req, res) => {
    const { storyId } = req.params;
    const { user_id: userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Thiếu chủ story.' });

    try {
        const current = await pool.query(
            'SELECT media_url, music_url FROM stories WHERE story_id = $1 AND user_id = $2',
            [storyId, userId]
        );
        if (current.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy story hoặc bạn không có quyền sửa.' });
        }

        const updates = [];
        const values = [];
        let valueIndex = 1;
        let replacementMediaUrl = null;
        let replacementMediaType = null;
        const storyMedia = getUploadedFile(req, 'storyMedia');
        const storyMusic = getUploadedFile(req, 'storyMusic');
        const spotifyTrackId = req.body.spotify_track_id || null;
        if (storyMusic && !isMp3File(storyMusic)) {
            cleanupUploadedFiles(req);
            return res.status(400).json({ message: 'Nhạc Story phải là tệp MP3.' });
        }

        if (storyMedia) {
            replacementMediaType = storyMedia.mimetype.startsWith('video/') ? 'video' : 'image';
            replacementMediaUrl = await uploadStoryAsset(storyMedia, 'social-media-clone-stories');
            updates.push(
                `media_url = $${valueIndex++}`,
                `media_type = $${valueIndex++}`,
                'shared_post_id = NULL'
            );
            values.push(replacementMediaUrl, replacementMediaType);
        }

        if (storyMusic) {
            const replacementMusicUrl = await uploadStoryAsset(storyMusic, 'social-media-clone-story-music');
            updates.push(`music_url = $${valueIndex++}`, `music_name = $${valueIndex++}`);
            values.push(replacementMusicUrl, storyMusic.originalname);
        } else if (req.body.removeMusic === 'true') {
            updates.push(`music_url = NULL`, `music_name = NULL`);
        }

        if (spotifyTrackId) {
            updates.push(
                `spotify_track_id = $${valueIndex++}`,
                `spotify_track_name = $${valueIndex++}`,
                `spotify_artist_name = $${valueIndex++}`,
                `spotify_external_url = $${valueIndex++}`
            );
            values.push(
                spotifyTrackId,
                req.body.spotify_track_name || null,
                req.body.spotify_artist_name || null,
                req.body.spotify_external_url || null
            );
        } else if (req.body.removeSpotifyMusic === 'true') {
            updates.push(
                'spotify_track_id = NULL',
                'spotify_track_name = NULL',
                'spotify_artist_name = NULL',
                'spotify_external_url = NULL'
            );
        }

        if (typeof req.body.sticker === 'string') {
            updates.push(`sticker = $${valueIndex++}`);
            values.push(req.body.sticker.trim() || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Chưa có nội dung nào để cập nhật.' });
        }

        values.push(storyId, userId);
        const result = await pool.query(
            `UPDATE stories
             SET ${updates.join(', ')}
             WHERE story_id = $${valueIndex} AND user_id = $${valueIndex + 1}
             RETURNING story_id, user_id, media_url, media_type, poll, sticker, music_url, music_name,
                       spotify_track_id, spotify_track_name, spotify_artist_name, spotify_external_url,
                       created_at, expires_at`,
            values
        );

        const oldMediaUrl = current.rows[0].media_url;
        if (replacementMediaUrl) {
            removeLocalUpload(oldMediaUrl);
        }
        if (storyMusic && current.rows[0].music_url) {
            removeLocalUpload(current.rows[0].music_url);
        } else if (req.body.removeMusic === 'true') {
            removeLocalUpload(current.rows[0].music_url);
        }
        res.json(result.rows[0]);
    } catch (err) {
        cleanupUploadedFiles(req);
        res.status(500).json({ message: 'Không thể sửa story.', error: err.message });
    }
};

const deleteStory = async (req, res) => {
    const { storyId } = req.params;
    const userId = req.body?.user_id || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu chủ story.' });

    try {
        const result = await pool.query(
            `DELETE FROM stories
             WHERE story_id = $1 AND user_id = $2
             RETURNING media_url, music_url`,
            [storyId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy story hoặc bạn không có quyền xóa.' });
        }

        const mediaUrl = result.rows[0].media_url;
        removeLocalUpload(mediaUrl);
        removeLocalUpload(result.rows[0].music_url);
        res.json({ message: 'Đã xóa story.' });
    } catch (err) {
        res.status(500).json({ message: 'Không thể xóa story.', error: err.message });
    }
};

const getUserActiveStories = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT s.story_id, s.user_id, s.media_url, s.media_type, s.poll, s.sticker,
                    s.music_url, s.music_name, s.spotify_track_id, s.spotify_track_name,
                    s.spotify_artist_name, s.spotify_external_url, s.shared_post_id,
                    s.created_at, s.expires_at,
                    u.username, u.profile_photo_url, (u.is_verified IS TRUE) AS is_verified
             FROM stories s
             JOIN users u ON u.user_id = s.user_id
             WHERE s.user_id = $1 AND s.expires_at > NOW()
             ORDER BY s.created_at ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Không thể tải story của người dùng.', error: err.message });
    }
};

const getHighlights = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT highlight_id, user_id, title, cover_url, stories, created_at
             FROM story_highlights
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Không thể tải tin nổi bật.', error: err.message });
    }
};

const createHighlight = async (req, res) => {
    const { user_id, title, cover_url, stories } = req.body;
    if (!user_id || !title?.trim()) {
        return res.status(400).json({ message: 'Vui lòng nhập tên tin nổi bật.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO story_highlights (user_id, title, cover_url, stories)
             VALUES ($1, $2, $3, $4::jsonb)
             RETURNING highlight_id, user_id, title, cover_url, stories, created_at`,
            [user_id, title.trim(), cover_url || null, JSON.stringify(stories || [])]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Không thể tạo tin nổi bật.', error: err.message });
    }
};

const deleteHighlight = async (req, res) => {
    const { highlightId } = req.params;
    const { user_id } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM story_highlights WHERE highlight_id = $1 AND user_id = $2 RETURNING highlight_id',
            [highlightId, user_id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin nổi bật hoặc không có quyền xóa.' });
        }
        res.json({ message: 'Đã xóa tin nổi bật thành công.' });
    } catch (err) {
        res.status(500).json({ message: 'Không thể xóa tin nổi bật.', error: err.message });
    }
};

module.exports = {
    createStory,
    getStories,
    viewStory,
    reactToStory,
    updateStory,
    deleteStory,
    getUserActiveStories,
    getHighlights,
    createHighlight,
    deleteHighlight
};
