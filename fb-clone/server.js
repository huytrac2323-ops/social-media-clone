const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Dữ liệu mẫu (Thay vì Database)
let posts = [
    {
        id: 1,
        author: "Sơn Tùng M-TP",
        avatar: "https://i.pravatar.cc/150?u=sontung",
        content: "Chào buổi sáng mọi người! Chúc một ngày tốt lành.",
        image: "https://picsum.photos/id/10/600/400",
        likes: 125,
        time: "10 phút trước"
    },
    {
        id: 2,
        author: "Mark Zuckerberg",
        avatar: "https://i.pravatar.cc/150?u=mark",
        content: "Hôm nay tôi đang xây dựng Metaverse.",
        image: "https://picsum.photos/id/20/600/400",
        likes: 500,
        time: "1 giờ trước"
    }
];

// API: Lấy danh sách bài viết
app.get('/api/posts', (req, res) => {
    res.json(posts);
});

// API: Đăng bài mới
app.post('/api/posts', (req, res) => {
    const { author, content } = req.body;
    const newPost = {
        id: posts.length + 1,
        author: author || "Người dùng ẩn danh",
        avatar: "https://i.pravatar.cc/150?u=guest",
        content: content,
        image: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/400`,
        likes: 0,
        time: "Vừa xong"
    };
    posts.unshift(newPost);
    res.status(201).json(newPost);
});

// API: Like bài viết
app.post('/api/posts/:id/like', (req, res) => {
    const id = parseInt(req.params.id);
    const post = posts.find(p => p.id === id);
    if (post) {
        post.likes += 1;
        res.json(post);
    } else {
        res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
