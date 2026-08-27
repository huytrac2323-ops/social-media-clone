const { pool } = require('../config/db'); //

const savePost = async (req, res) => { //
    const { postId } = req.params; //
    const { user_id } = req.body; //[cite: 2]

    if (!user_id || !postId) { //[cite: 2]
        return res.status(400).json({ message: "Thiếu thông tin user_id hoặc postId" }); //[cite: 2]
    }

    try {
        const checkExist = await pool.query( //[cite: 2]
            'SELECT * FROM saved_posts WHERE user_id = $1 AND post_id = $2', //[cite: 2]
            [user_id, postId] //[cite: 2]
        ); //[cite: 2]

        if (checkExist.rows.length > 0) { //[cite: 2]
            return res.status(200).json({ message: "Bài viết này đã được lưu từ trước!" }); //[cite: 2]
        }

        await pool.query( //[cite: 2]
            'INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)', //[cite: 2]
            [user_id, postId] //[cite: 2]
        ); //[cite: 2]

        return res.status(200).json({ message: "Đã lưu bài viết thành công!" }); //[cite: 2]
    } catch (error) {
        console.error("Lỗi chi tiết khi lưu bài viết tại Server:", error.message); //[cite: 2]
        return res.status(500).json({ message: "Lỗi Server nội bộ", error: error.message }); //[cite: 2]
    }
};

const unsavePost = async (req, res) => { //[cite: 2]
    const { postId } = req.params; //[cite: 2]
    const { user_id } = req.body; //[cite: 2]

    try {
        await pool.query( //[cite: 2]
            'DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2', //[cite: 2]
            [user_id, postId] //[cite: 2]
        ); //[cite: 2]
        res.status(200).json({ message: "Đã hủy lưu bài viết!" }); //[cite: 2]
    } catch (error) {
        console.error("Lỗi khi hủy lưu bài viết:", error); //[cite: 2]
        res.status(500).json({ error: "Lỗi Server" }); //[cite: 2]
    }
};
// Ví dụ Route lấy danh sách bài viết đã lưu


const getSavedPosts = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT p.post_id, p.caption AS content, p.photo_url, p.created_at,
                    u.username AS author, u.profile_photo_url AS "authorAvatar", u.user_id AS "userId",
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS likes,
                    (SELECT COUNT(*) FROM shares s WHERE s.post_id = p.post_id) AS "sharesCount",
                    COALESCE(
                            (SELECT json_agg(json_build_object(
                                    'comment_id', c.comment_id,
                                    'comment_text', c.comment_text,
                                    'username', cu.username,
                                    'profile_photo_url', cu.profile_photo_url,
                                    'created_at', c.created_at
                                             )) FROM comments c
                                                         JOIN users cu ON c.user_id = cu.user_id
                             WHERE c.post_id = p.post_id),
                            '[]'::json
                    ) AS comments
             FROM saved_posts sp
                      JOIN post p ON sp.post_id = p.post_id
                      JOIN users u ON p.user_id = u.user_id
             WHERE sp.user_id = $1`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách bài viết đã lưu:", error.message);
        res.status(500).json({ error: "Lỗi Server", details: error.message });
    }
};
// Đảm bảo export chung với các hàm khác
module.exports = { savePost, unsavePost, getSavedPosts };