import React, { useState } from 'react';
import './App.css';

function App() {
    const [posts, setPosts] = useState([
        {
            id: 1,
            author: "Trác Nhất Huy",
            time: "5 phút trước",
            content: "Học lập trình Web với React thật là thú vị! Dự án Facebook Clone đang dần hoàn thiện rồi. 🚀",
            likes: 12,
        },
        {
            id: 2,
            author: "Nguyễn Văn A",
            time: "2 giờ trước",
            content: "Hôm nay thời tiết Cần Thơ đẹp quá, có ai đi cà phê Ninh Kiều không?",
            likes: 5,
        }
    ]);

    const [inputText, setInputText] = useState("");

    const handlePostSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newPost = {
            id: posts.length + 1,
            author: "Trác Nhất Huy",
            time: "Vừa xong",
            content: inputText,
            likes: 0
        };

        setPosts([newPost, ...posts]);
        setInputText("");
    };

    return (
        <div className="fb-container">
            {/* 1. THANH ĐIỀU HƯỚNG (NAVBAR) */}
            <nav className="fb-navbar">
                <div className="nav-left">
                    <h1 className="fb-logo">facebook</h1>
                    <input type="text" placeholder="Tìm kiếm trên Facebook" className="search-bar" />
                </div>
                <div className="nav-right">
                    <div className="user-avatar-btn">Huy</div>
                </div>
            </nav>

            {/* CƠ CẤU TRANG WEB 3 CỘT */}
            <div className="fb-body">

                {/* 2. CỘT TRÁI (SIDEBAR) */}
                <aside className="fb-sidebar">
                    <div className="sidebar-item"><b>Trác Nhất Huy</b></div>
                    <div className="sidebar-item">👥 Bạn bè</div>
                    <div className="sidebar-item">💾 Đã lưu</div>
                    <div className="sidebar-item">🏳️ Trang</div>
                    <div className="sidebar-item">📅 Sự kiện</div>
                </aside>

                {/* 3. BẢNG TIN Ở GIỮA (NEWSFEED) */}
                <main className="fb-feed">
                    {/* Hộp đăng bài mới */}
                    <div className="create-post">
                        <form onSubmit={handlePostSubmit}>
              <textarea
                  placeholder="Huy ơi, bạn đang nghĩ gì thế?"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
              />
                            <hr />
                            <button type="submit" className="btn-post">Đăng</button>
                        </form>
                    </div>

                    {/* Danh sách bài viết */}
                    {posts.map((post) => (
                        <div key={post.id} className="post-card">
                            <div className="post-header">
                                <div className="avatar-placeholder">{post.author[0]}</div>
                                <div>
                                    <h4 className="post-author">{post.author}</h4>
                                    <span className="post-time">{post.time}</span>
                                </div>
                            </div>
                            <p className="post-content">{post.content}</p>
                            <hr />
                            <div className="post-actions">
                                <button className="action-btn">👍 Thích ({post.likes})</button>
                                <button className="action-btn">💬 Bình luận</button>
                                <button className="action-btn">↪️ Chia sẻ</button>
                            </div>
                        </div>
                    ))}
                </main>

                {/* 4. CỘT PHẢI (RIGHTBAR - BẠN BÈ) */}
                <aside className="fb-rightbar">
                    <h3>Người liên hệ</h3>
                    <div className="contact-item"><span className="online-dot"></span> Nguyễn Văn A</div>
                    <div className="contact-item"><span className="online-dot"></span> Trần Thị B</div>
                    <div className="contact-item"><span className="online-dot"></span> Lê Văn C</div>
                </aside>

            </div>
        </div>
    );
}

export default App;