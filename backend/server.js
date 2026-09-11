const { pool } = require('./config/db'); // hoặc './db' tùy vị trí thực tế
const express = require('express');
const http = require('http'); // ⚠️ Bắt buộc phải có để chạy Socket.io
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const {
    getSavedPosts, savePost, unsavePost, getCollections,
    createCollection, addPostToCollection, getCollectionPosts
} = require('./controllers/SavedPostController');
require('dotenv').config();
const postController = require('./controllers/postController');


// Khởi tạo Express app
const app = express();

// 1. IMPORT CONTROLLERS & DB
const { poolPromise } = require('./config/db'); //const { savePost, unsavePost } = require('./controllers/savedPostController');
const {
    getNotifications,
    markNotificationsRead,
    setNotificationEmitter
} = require('./controllers/NotificationController');
const { getMessages } = require('./controllers/messageController');

// Import các Routes cũ của bạn
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const storyRoutes = require('./routes/storyRoutes');
const spotifyRoutes = require('./routes/spotifyRoutes');
const exploreRoutes = require('./routes/exploreRoutes');



// 2. Cấu hình CORS cho phép mọi nguồn (hoặc định nghĩa cụ thể)
const corsOptions = {
    origin: '*', // Cho phép mọi nguồn gọi vào (Thích hợp cho việc test app mobile và web)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors({ origin: '*' }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static('public'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static('public'));


// 3. ĐĂNG KÝ CÁC ROUTES
app.use('/api/friends', friendRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/explore', exploreRoutes);



// --- CÁC API MỚI CHO TÍNH NĂNG LƯU BÀI & THÔNG BÁO & CHAT ---
app.post('/api/posts/:postId/save', savePost);
app.delete('/api/posts/:postId/unsave', unsavePost);
app.get('/api/notifications/:userId', getNotifications);
app.patch('/api/notifications/:userId/read', markNotificationsRead);
app.get('/api/saved-posts/:userId', getSavedPosts);
app.get('/api/saved-collections/:userId', getCollections);
app.post('/api/saved-collections', createCollection);
app.patch('/api/posts/:postId/collection', addPostToCollection);
app.get('/api/saved-collections/:collectionId/posts/:userId', getCollectionPosts);
app.delete('/api/comments/:commentId', postController.deleteComment);



app.get('/api/messages/:userId/:friendId', async (req, res) => {
    const { userId, friendId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, friendId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("CHI TIẾT LỖI SQL GET MESSAGES:", error.message); // 👈 In lỗi ra terminal
        res.status(500).json({ error: "Lỗi Server", details: error.message });
    }
});

app.post('/api/messages', async (req, res) => {
    const { sender_id, receiver_id, message_text } = req.body;
    if (!sender_id || !receiver_id || !message_text) {
        return res.status(400).json({ error: "Thiếu thông tin gửi tin nhắn (sender_id, receiver_id hoặc message_text)" });
    }
    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, message_text) 
             VALUES ($1, $2, $3) RETURNING *`,
            [sender_id, receiver_id, message_text]
        );
        const savedMessage = result.rows[0];
        const participantIds = new Set([String(sender_id), String(receiver_id)]);
        participantIds.forEach(userId => {
            onlineUsers.get(userId)?.forEach(socketId => {
                io.to(socketId).emit('receive_message', savedMessage);
            });
        });
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error.message);
        res.status(500).json({ error: "Lỗi Server khi gửi tin nhắn", details: error.message });
    }
});
app.get('/api/suggestions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        if (userId === 'guest' || userId === 'undefined') {
            const query = `
                SELECT user_id, COALESCE(username, 'user_' || user_id) AS username, profile_photo_url, (is_verified IS TRUE) AS is_verified, address, hometown, age, interests 
                FROM users 
                ORDER BY (is_verified IS TRUE) DESC, created_at DESC 
                LIMIT 10;
            `;
            const result = await pool.query(query);
            const rows = result.rows.map(user => ({
                ...user,
                suggestion_reason: user.is_verified ? '⭐ Tài khoản nổi bật' : 'Gợi ý cho bạn'
            }));
            return res.json(rows);
        }

        // Lấy thông tin người dùng hiện tại để so khớp vị trí & sở thích
        const currentRes = await pool.query(
            'SELECT user_id, username, address, hometown, age, interests FROM users WHERE user_id = $1',
            [userId]
        );
        const currentUser = currentRes.rows[0] || null;

        // Lấy danh sách các tài khoản chưa kết bạn
        const candidateQuery = `
            SELECT user_id, COALESCE(username, 'user_' || user_id) AS username, profile_photo_url, 
                   (is_verified IS TRUE) AS is_verified, address, hometown, age, interests 
            FROM users 
            WHERE user_id != $1 
              AND user_id NOT IN (SELECT friend_id FROM friends WHERE user_id = $1)
              AND user_id NOT IN (SELECT user_id FROM friends WHERE friend_id = $1)
            LIMIT 40;
        `;
        const candidateResult = await pool.query(candidateQuery, [userId]);
        const candidates = candidateResult.rows;

        const normalizeStr = (s) => (s ? String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '');
        const currAddress = normalizeStr(currentUser?.address);
        const currHometown = normalizeStr(currentUser?.hometown);
        const currAge = currentUser?.age ? Number(currentUser.age) : null;
        const currInterests = normalizeStr(currentUser?.interests)
            .split(/[,;]+/)
            .map(t => t.trim())
            .filter(t => t.length >= 2);

        const scored = candidates.map(user => {
            let score = 0;
            let reason = '';

            const uAddress = normalizeStr(user.address);
            const uHometown = normalizeStr(user.hometown);
            const uAge = user.age ? Number(user.age) : null;
            const uInterests = normalizeStr(user.interests)
                .split(/[,;]+/)
                .map(t => t.trim())
                .filter(t => t.length >= 2);

            // Tìm sở thích chung giữa người dùng và ứng viên
            let commonInterests = [];
            if (currInterests.length > 0 && uInterests.length > 0) {
                commonInterests = currInterests.filter(ci => uInterests.some(ui => ui.includes(ci) || ci.includes(ui)));
            }

            const originalTags = (user.interests || '').split(',').map(s => s.trim()).filter(Boolean);
            const matchedTags = originalTags.filter(ot => commonInterests.some(ci => normalizeStr(ot).includes(ci)));
            const displayCommon = matchedTags.length > 0 ? matchedTags.slice(0, 2).join(', ') : commonInterests.slice(0, 2).join(', ');

            // 1. Ưu tiên hàng đầu: Tài khoản KOL tích xanh có sở thích liên quan (+150 điểm)
            if (user.is_verified && commonInterests.length > 0) {
                score += 150 + commonInterests.length * 30;
                reason = `⭐ KOL cùng sở thích: ${displayCommon}`;
            } else if (commonInterests.length > 0) {
                score += commonInterests.length * 35;
                reason = `✨ Cùng sở thích: ${displayCommon}`;
            } else if (user.is_verified) {
                // Tự động đề xuất KOL nổi bật (+50 điểm)
                score += 50;
                reason = '⭐ KOL nổi bật';
            }

            // 2. So khớp địa chỉ / nơi ở (+40 điểm)
            if (currAddress && uAddress) {
                if (currAddress === uAddress || currAddress.includes(uAddress) || uAddress.includes(currAddress)) {
                    score += 40;
                    if (!reason) {
                        reason = `📍 Cùng ở ${user.address}`;
                    }
                }
            }

            // 3. So khớp quê quán (+35 điểm)
            if (currHometown && uHometown) {
                if (currHometown === uHometown || currHometown.includes(uHometown) || uHometown.includes(currHometown)) {
                    score += 35;
                    if (!reason) {
                        reason = `🏡 Cùng quê ${user.hometown}`;
                    }
                }
            }

            // 4. So khớp độ tuổi (~ 3 tuổi) (+20 điểm)
            if (currAge && uAge) {
                const diff = Math.abs(currAge - uAge);
                if (diff <= 3) {
                    score += Math.max(10, 25 - diff * 5);
                    if (!reason) {
                        reason = `🎂 Cùng độ tuổi (~${uAge})`;
                    }
                }
            }

            if (!reason) {
                reason = 'Gợi ý cho bạn';
            }

            return {
                ...user,
                score,
                suggestion_reason: reason
            };
        });

        scored.sort((a, b) => b.score - a.score);
        res.json(scored.slice(0, 15));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/friends/requests/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT f.id, u.user_id, u.username, u.profile_photo_url 
            FROM friends f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.friend_id = $1 AND f.status = 'pending';
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/friends/accept', async (req, res) => {
    const { user_id, friend_id } = req.body;
    // user_id: người đang đăng nhập (chấp nhận), friend_id: người gửi lời mời
    try {
        await pool.query(
            'UPDATE friends SET status = \'accepted\' WHERE user_id = $2 AND friend_id = $1',
            [user_id, friend_id]
        );
        await pool.query(
            `INSERT INTO follows (follower_id, followee_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [friend_id, user_id]
        );
        res.status(200).json({ message: "Đã chấp nhận kết bạn!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/friends/remove', async (req, res) => {
    const { user_id, friend_id } = req.body;
    try {
        await pool.query(
            'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [user_id, friend_id]
        );
        res.status(200).json({ message: "Đã hủy kết bạn!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/conversations/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT DISTINCT u.user_id, u.username, u.profile_photo_url 
             FROM users u 
             JOIN messages m ON u.user_id = m.sender_id OR u.user_id = m.receiver_id 
             WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.user_id != $1`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách trò chuyện:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

app.post('/api/friends/request', async (req, res) => {
    const { user_id, friend_id } = req.body;

    if (!user_id || !friend_id) {
        return res.status(400).json({ error: "Thiếu thông tin định danh!" });
    }

    if (user_id === friend_id) {
        return res.status(400).json({ error: "Không thể tự kết bạn với chính mình!" });
    }

    try {
        await pool.query(
            `INSERT INTO friends (user_id, friend_id, status)
             VALUES ($1, $2, 'pending')
                 ON CONFLICT (user_id, friend_id) DO NOTHING`,
            [user_id, friend_id]
        );
        res.status(200).json({ message: "Đã gửi yêu cầu kết bạn thành công!" });
    } catch (err) {
        console.error("Lỗi gửi yêu cầu kết bạn:", err.message);
        res.status(500).json({ error: err.message });
    }
});




// 4. Cấu hình Socket.io CORS tương ứng

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi kết nối Socket từ di động hoặc web
        methods: ["GET", "POST"]
    }
});
const onlineUsers = new Map();
setNotificationEmitter(({ receiverId, notification }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    receiverSockets?.forEach(socketId => {
        io.to(socketId).emit('notification_created', notification);
    });
});

// Xử lý sự kiện Chat Real-time và lưu vào PostgreSQL
io.on('connection', (socket) => {
    console.log(`⚡ Một người dùng vừa kết nối Socket: ${socket.id}`);
    socket.on('user_online', (userId) => {
        if (!userId) return;
        const userSockets = onlineUsers.get(String(userId)) || new Set();
        userSockets.add(socket.id);
        onlineUsers.set(String(userId), userSockets);
        io.emit('presence_changed', { userId, online: true });
    });
    socket.on('typing', ({ sender_id, receiver_id, isTyping }) => {
        const receiverSockets = onlineUsers.get(String(receiver_id));
        receiverSockets?.forEach(socketId => {
            io.to(socketId).emit('user_typing', { user_id: sender_id, isTyping });
        });
    });
    socket.on('mark_messages_read', async ({ reader_id, sender_id }) => {
        try {
            await pool.query(
                'UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
                [sender_id, reader_id]
            );
            const senderSockets = onlineUsers.get(String(sender_id));
            senderSockets?.forEach(socketId => {
                io.to(socketId).emit('messages_read', { reader_id, sender_id });
            });
        } catch (error) {
            console.error('Lỗi đánh dấu tin nhắn đã đọc:', error.message);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            // 👇 IN DÒNG NÀY RA ĐỂ KIỂM TRA XEM REACT CÓ GỬI ĐÚNG ID KHÔNG
            console.log("Dữ liệu nhận từ Client:", data);

            if (!data.sender_id || !data.receiver_id || !data.message_text) {
                console.error("❌ Thiếu thông tin gửi tin nhắn (sender_id, receiver_id hoặc message_text)!");
                return;
            }

            const result = await pool.query(
                'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING *',
                [data.sender_id, data.receiver_id, data.message_text]
            );

            const savedMessage = result.rows[0];
            const participantIds = new Set([String(data.sender_id), String(data.receiver_id)]);
            participantIds.forEach(userId => {
                onlineUsers.get(userId)?.forEach(socketId => {
                    io.to(socketId).emit('receive_message', savedMessage);
                });
            });
        } catch (error) {
            console.error("❌ Lỗi khi lưu tin nhắn Socket vào DB:", error.message);
        }
    });
    socket.on('disconnect', () => {
        for (const [userId, socketIds] of onlineUsers.entries()) {
            if (socketIds.delete(socket.id)) {
                if (socketIds.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('presence_changed', { userId, online: false });
                }
                break;
            }
        }
        console.log(`🔌 Người dùng đã ngắt kết nối: ${socket.id}`);
    });
});


// 5. KHỞI ĐỘNG SERVER & KIỂM TRA KẾT NỐI DB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Kiểm tra kết nối database trước khi mở cổng server
        const client = await pool.connect();
        console.log("✅ Kết nối Database PostgreSQL thành công!");
        await client.query(`
            CREATE TABLE IF NOT EXISTS stories (
                story_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                media_url VARCHAR(500),
                media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
                poll JSONB,
                sticker VARCHAR(100),
                music_url VARCHAR(500),
                music_name VARCHAR(255),
                spotify_track_id VARCHAR(100),
                spotify_track_name VARCHAR(255),
                spotify_artist_name VARCHAR(255),
                spotify_external_url VARCHAR(500),
                shared_post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMP NOT NULL
            )
        `);
        await client.query('CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories(expires_at)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS poll JSONB');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS sticker VARCHAR(100)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_url VARCHAR(500)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_name VARCHAR(255)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS spotify_track_id VARCHAR(100)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS spotify_track_name VARCHAR(255)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS spotify_artist_name VARCHAR(255)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS spotify_external_url VARCHAR(500)');
        await client.query('ALTER TABLE stories ADD COLUMN IF NOT EXISTS shared_post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE');
        await client.query('ALTER TABLE stories ALTER COLUMN media_url DROP NOT NULL');
        await client.query('ALTER TABLE stories ALTER COLUMN media_type DROP NOT NULL');
        await client.query(`
            CREATE TABLE IF NOT EXISTS story_views (
                story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
                viewer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (story_id, viewer_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS story_poll_votes (
                story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
                voter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                option_value VARCHAR(255) NOT NULL,
                voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (story_id, voter_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS story_reactions (
                story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                reaction VARCHAR(8) NOT NULL,
                reacted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (story_id, user_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id SERIAL PRIMARY KEY,
                receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                type VARCHAR(30) NOT NULL,
                content VARCHAR(500) NOT NULL,
                post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        // Keep databases created by older versions compatible with notifications.
        await client.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE');
        await client.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE');
        await client.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()');
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                token_hash VARCHAR(64) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE');
        await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP');
        await client.query('ALTER TABLE post ADD COLUMN IF NOT EXISTS location VARCHAR(100)');
        await client.query(`
            CREATE TABLE IF NOT EXISTS saved_posts (
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, post_id)
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS saved_collections (
                collection_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                UNIQUE (user_id, name)
            )
        `);
        await client.query('ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS collection_id INTEGER REFERENCES saved_collections(collection_id) ON DELETE SET NULL');
        client.release();

        server.listen(PORT, () => {
            console.log(`🚀 Server web đang chạy trên cổng ${PORT}`);
        });
    } catch (err) {
        console.error("❌ SERVER KHÔNG THỂ KHỞI ĐỘNG DO LỖI DB:", err);
    }
};

startServer();