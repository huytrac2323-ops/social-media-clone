-- ==============================================================================
-- SCHEMA CHO DỰ ÁN SOCIAL MEDIA (CHẠY TRÊN SUPABASE / POSTGRESQL)
-- Bạn chỉ cần copy toàn bộ nội dung file này dán vào Supabase SQL Editor và nhấn RUN
-- ==============================================================================

-- 1. BẢNG USERS (Người dùng)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    profile_photo_url VARCHAR(500) DEFAULT 'https://picsum.photos/100',
    bio TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    address VARCHAR(255),
    hometown VARCHAR(255),
    age INTEGER,
    interests VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. BẢNG BLACKLIST TOKEN (Dành cho chức năng đăng xuất)
CREATE TABLE IF NOT EXISTS token_blacklist (
    token TEXT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. BẢNG KHÔI PHỤC MẬT KHẨU
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. BẢNG BÀI VIẾT (POST)
CREATE TABLE IF NOT EXISTS post (
    post_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    caption TEXT,
    photo_url VARCHAR(500),
    location VARCHAR(100),
    shared_post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. BẢNG BÌNH LUẬN (COMMENTS)
CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. BẢNG THÍCH BÀI VIẾT (POST LIKES)
CREATE TABLE IF NOT EXISTS post_likes (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(user_id, post_id)
);

-- 7. BẢNG THÍCH BÌNH LUẬN (COMMENT LIKES)
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_id INTEGER NOT NULL REFERENCES comments(comment_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(user_id, comment_id)
);

-- 8. BẢNG THEO DÕI (FOLLOWS)
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    followee_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(follower_id, followee_id)
);

-- 9. BẢNG BẠN BÈ (FRIENDS)
CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(user_id, friend_id)
);

-- 10. BẢNG TIN NHẮN (MESSAGES)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. BẢNG CHIA SẺ (SHARES)
CREATE TABLE IF NOT EXISTS shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. BẢNG BỘ SƯU TẬP LƯU BÀI VIẾT (SAVED COLLECTIONS)
CREATE TABLE IF NOT EXISTS saved_collections (
    collection_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

-- 13. BẢNG BÀI VIẾT ĐÃ LƯU (SAVED POSTS)
CREATE TABLE IF NOT EXISTS saved_posts (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES saved_collections(collection_id) ON DELETE SET NULL,
    saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 14. BẢNG BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 15. BẢNG HASHTAGS
CREATE TABLE IF NOT EXISTS hashtags (
    hashtag_id SERIAL PRIMARY KEY,
    hashtag_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 16. BẢNG POST_TAGS
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    hashtag_id INTEGER NOT NULL REFERENCES hashtags(hashtag_id) ON DELETE CASCADE,
    PRIMARY KEY(post_id, hashtag_id)
);

-- 17. BẢNG BẢN TIN 24H (STORIES)
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
);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories(expires_at);

-- 18. BẢNG LƯỢT XEM STORY (STORY VIEWS)
CREATE TABLE IF NOT EXISTS story_views (
    story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, viewer_id)
);

-- 19. BẢNG BÌNH CHỌN STORY (STORY POLL VOTES)
CREATE TABLE IF NOT EXISTS story_poll_votes (
    story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    voter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    option_value VARCHAR(255) NOT NULL,
    voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, voter_id)
);

-- 20. BẢNG CẢM XÚC STORY (STORY REACTIONS)
CREATE TABLE IF NOT EXISTS story_reactions (
    story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reaction VARCHAR(8) NOT NULL,
    reacted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

-- 21. BẢNG THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    content VARCHAR(500) NOT NULL,
    post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CÁC INDEX TỐI ƯU HIỆU NĂNG TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_post_user_id ON post(user_id);
CREATE INDEX IF NOT EXISTS idx_post_created_at ON post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id, status);

-- DỮ LIỆU MẪU BAN ĐẦU (Nếu bạn import file backup cũ thì KHÔNG cần chạy đoạn này)
-- INSERT INTO users (username, email, password_hash, bio, profile_photo_url)
-- VALUES 
--     ('admin', 'admin@example.com', '$2b$10$mB3t3PvZz2eE4oK3QxHw4O7BqfUvW5x6lG2YyR3qM.w4eHqZJc1aK', 'Quản trị viên hệ thống', 'https://picsum.photos/100'),
--     ('tracnhathuy', 'huy@example.com', '$2b$10$mB3t3PvZz2eE4oK3QxHw4O7BqfUvW5x6lG2YyR3qM.w4eHqZJc1aK', 'Xin chào, đây là tài khoản mẫu trên Supabase!', 'https://picsum.photos/101')
-- ON CONFLICT (username) DO NOTHING;

