const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const MOCK_USERS = [
  {
    username: 'alex_design',
    name: 'Alex Nguyễn',
    email: 'alex.design@novagen.vn',
    bio: 'Lead UI/UX Designer @ Nova Studio. 6 năm thiết kế Fintech, Design System & Mobile App. Nhận dự án freelance.',
    creator_type: 'UI/UX Design',
    is_verified: true,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    address: 'TP. Hồ Chí Minh'
  },
  {
    username: 'maya_3dart',
    name: 'Maya Vũ',
    email: 'maya.3d@novagen.vn',
    bio: '3D Motion & CGI Visual Artist. Chuyên diễn họa sản phẩm, quảng cáo TVC với Blender & Cinema 4D.',
    creator_type: '3D & Motion',
    is_verified: true,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    address: 'Hà Nội'
  },
  {
    username: 'tranquoc_brand',
    name: 'Trần Quốc Huy',
    email: 'tranquoc.brand@novagen.vn',
    bio: 'Brand Identity & Typography Director. Tư vấn xây dựng hình ảnh thương hiệu trọn gói cho F&B và Startup.',
    creator_type: 'Đồ họa & Thương hiệu',
    is_verified: true,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    address: 'Đà Nẵng'
  },
  {
    username: 'linh_dan_art',
    name: 'Linh Đan Art',
    email: 'linhdan.art@novagen.vn',
    bio: 'Digital Illustrator & Concept Artist. Vẽ minh họa bìa sách, album nhạc và visual storytelling.',
    creator_type: 'Minh họa & Art',
    is_verified: true,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    address: 'Hà Nội'
  },
  {
    username: 'hoang_visuals',
    name: 'Hoàng Visual',
    email: 'hoang.visuals@novagen.vn',
    bio: 'Video Editor & Motion Designer. Dựng video quảng cáo TVC, TikTok Reels và chuyển động đồ họa After Effects.',
    creator_type: 'Làm Video & Editor',
    is_verified: true,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    address: 'TP. Hồ Chí Minh'
  },
  {
    username: 'khoa_tech',
    name: 'Khoa Đăng',
    email: 'khoa.dev@novagen.vn',
    bio: 'Creative Frontend Developer & Web Designer. Xây dựng website hiện đại, tương tác mượt mà với React & Three.js.',
    creator_type: 'Website & Tech',
    is_verified: false,
    open_for_collab: true,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    address: 'Cần Thơ'
  }
];

const MOCK_PROJECTS = [
  {
    authorUsername: 'alex_design',
    title: 'NovaBank - Mobile Banking & Crypto Wallet App UI/UX',
    category: 'UI/UX Design',
    caption: 'Dự án tái thiết kế ứng dụng ngân hàng số NovaBank kết hợp ví tiền điện tử. Tối ưu trải nghiệm chuyển tiền 1 chạm, biểu đồ tài chính trực quan và hệ thống bảo mật sinh trắc học hiện đại.',
    photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['Figma', 'Protopie', 'Illustrator'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80',
        caption: 'Giai đoạn 1: Khảo sát hành vi người dùng Gen Z và thiết lập Wireframes luồng giao dịch nhanh.'
      },
      {
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
        caption: 'Giai đoạn 2: Xây dựng Design System quy chuẩn màu sắc, font chữ và các Component tái sử dụng.'
      },
      {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
        caption: 'Giai đoạn 3: Hoàn thiện giao diện sắc nét kèm Prototype tương tác Micro-interaction mượt mà.'
      }
    ],
    views_count: 2480,
    likes: 185
  },
  {
    authorUsername: 'maya_3dart',
    title: 'Cybernetic Flow - Abstract 3D Render & Motion Exploration',
    category: '3D & Hoạt hình',
    caption: 'Chuỗi tác phẩm 3D trừu tượng khai thác sự tương phản giữa kim loại chất lỏng và ánh sáng neon tương lai. Thực hiện hoàn toàn bằng Blender Cycles và hậu kỳ trong After Effects.',
    photo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['Blender', 'Cinema 4D', 'Octane', 'After Effects'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
        caption: 'Bước 1: Mô hình hóa cấu trúc hình học Procedural và thiết lập nguồn sáng Studio 3 điểm.'
      },
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        caption: 'Bước 2: Gán vật liệu tán xạ thủy tinh quang phổ và render 4K với Octane Render.'
      }
    ],
    views_count: 3120,
    likes: 240
  },
  {
    authorUsername: 'tranquoc_brand',
    title: 'Oasis Roastery - Coffee Brand Identity & Packaging Design',
    category: 'Thiết kế đồ họa',
    caption: 'Hệ thống nhận diện thương hiệu cho chuỗi cà phê đặc sản Oasis Roastery. Thiết kế bao bì túi hạt cà phê, ly giấy mang đi và bộ vật phẩm quà tặng phong cách Scandinavian tinh tế.',
    photo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['Illustrator', 'Photoshop', 'InDesign'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1200&auto=format&fit=crop&q=80',
        caption: 'Ý tưởng Logo: Kết hợp giữa giọt cà phê và chiếc lá sa mạc theo tỷ lệ vàng đối xứng.'
      },
      {
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
        caption: 'Ứng dụng bao bì túi giấy xi măng tái chế bảo vệ môi trường và tem nhãn phân biệt xuất xứ hạt.'
      }
    ],
    views_count: 1980,
    likes: 162
  },
  {
    authorUsername: 'linh_dan_art',
    title: 'Memories of Summer - Digital Painting & Storybook Concept',
    category: 'Minh họa & Art',
    caption: 'Bộ tranh vẽ kỹ thuật số lấy cảm hứng từ những chiều hè thanh bình thời thơ ấu. Tông màu ấm áp, giàu cảm xúc, thích hợp cho bìa sách hoặc artbook.',
    photo_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['Procreate', 'Photoshop'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
        caption: 'Phác thảo bố cục và dựng khối giá trị sắc độ ánh sáng trước khi lên màu chi tiết.'
      },
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
        caption: 'Hoàn thiện màu sắc và chất liệu cọ dầu hạt mịn tạo chiều sâu hoài niệm.'
      }
    ],
    views_count: 1750,
    likes: 198
  },
  {
    authorUsername: 'hoang_visuals',
    title: 'Pulse Energy Drink - 3D Commercial Motion Graphic & TVC',
    category: 'Làm Video & Editor',
    caption: 'Video quảng cáo 3D Motion sôi động dành cho chiến dịch ra mắt lon nước tăng lực Pulse Energy. Hiệu ứng bọt sủi sống động và chuyển động camera nghẹt thở.',
    photo_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['After Effects', 'Premiere Pro', 'Cinema 4D'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80',
        caption: 'Keyframe mô phỏng chuyển động bắn tóe của chất lỏng kết hợp nhịp nhạc điện tử sôi động.'
      }
    ],
    views_count: 1420,
    likes: 125
  },
  {
    authorUsername: 'khoa_tech',
    title: 'Aura Studio - 3D Interactive Web Experience & Portfolio',
    category: 'Website',
    caption: 'Trang web tương tác 3D WebGL dành cho Studio kiến trúc Aura. Sử dụng Three.js kết hợp Next.js cho trải nghiệm mượt mà 60 FPS trên mọi thiết bị di động.',
    photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
    tools_used: ['Figma', 'Three.js', 'React'],
    project_images: [
      {
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
        caption: 'Tối ưu hóa Shader và Model 3D nén Draco giúp tải trang dưới 1.2 giây.'
      }
    ],
    views_count: 2150,
    likes: 174
  }
];

const MOCK_SOCIAL_POSTS = [
  {
    authorUsername: 'alex_design',
    caption: 'Vừa hoàn thiện xong bộ Design System cho dự án Fintech mới 🔥 Mọi người chấm điểm giao diện tối giản này bao nhiêu trên thang điểm 10?',
    photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
  },
  {
    authorUsername: 'maya_3dart',
    caption: 'Một góc bàn làm việc ngập tràn ánh sáng sáng nay ☕️ Hôm nay tiếp tục render scene animation cho khách hàng, chúc cả nhà ngày mới nhiều cảm hứng!',
    photo_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'
  },
  {
    authorUsername: 'tranquoc_brand',
    caption: 'Thử nghiệm bảng màu đất ấm áp cho concept nhận diện quán trà đạo sắp mở tại Đà Lạt 🍵 Bạn thích tông xanh rêu hay vàng mù tạt hơn?',
    photo_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
  }
];

const MOCK_COLLABORATIONS = [
  {
    authorUsername: 'alex_design',
    title: 'Cần tìm 3D Artist thiết kế 5 nhân vật Mascot 3D cho dự án EduTech',
    category: '3D & Motion Graphics',
    budget: '12.000.000đ - 18.000.000đ',
    deadline: 'Trong 3 tuần',
    job_type: 'freelance',
    description: 'Chúng tôi đang triển khai nền tảng học tiếng Anh cho trẻ em và cần tìm bạn 3D Artist giàu kinh nghiệm để tạo hình 5 nhân vật linh vật ngộ nghĩnh, biểu cảm đa dạng. Yêu cầu bàn giao file Blender hoặc FBX rig chuẩn.',
    skills_required: ['Blender', 'Character Design', '3D Modeling', 'Texturing']
  },
  {
    authorUsername: 'tranquoc_brand',
    title: 'Tuyển Freelance UI/UX Designer thiết kế Landing Page giới thiệu thương hiệu',
    category: 'UI/UX Design',
    budget: '6.000.000đ - 9.000.000đ',
    deadline: 'Gấp trong 10 ngày',
    job_type: 'freelance',
    description: 'Cần một bạn thiết kế giao diện Landing Page cho thương hiệu thời trang cao cấp. Đã có sẵn brand guideline và hình ảnh chụp lookbook chất lượng cao. Thiết kế bằng Figma responsive Desktop & Mobile.',
    skills_required: ['Figma', 'UI/UX', 'Landing Page', 'Responsive Design']
  },
  {
    authorUsername: 'hoang_visuals',
    title: 'Tìm Digital Illustrator vẽ 8 tranh minh họa vector phong cách Flat Art',
    category: 'Minh họa & Art',
    budget: '5.000.000đ',
    deadline: 'Trong 2 tuần',
    job_type: 'remote',
    description: 'Dự án sách hướng dẫn kỹ năng sống cần 8 tranh minh họa dạng vector minh họa các tình huống giao tiếp đời thường. Phong cách hiện đại, màu sắc tươi sáng.',
    skills_required: ['Illustrator', 'Procreate', 'Flat Art', 'Illustration']
  }
];

async function seedData() {
  const client = await pool.connect();
  console.log('🚀 Bắt đầu nạp dữ liệu mẫu cho NovaGen...');

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const userMap = {};

    // 1. Nạp Users
    for (const u of MOCK_USERS) {
      const check = await client.query('SELECT user_id FROM users WHERE username = $1', [u.username]);
      let userId;
      if (check.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO users (username, password_hash, email, profile_photo_url, bio, creator_type, is_verified, open_for_collab, address, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           RETURNING user_id`,
          [u.username, hashedPassword, u.email, u.avatar, u.bio, u.creator_type, u.is_verified, u.open_for_collab, u.address]
        );
        userId = res.rows[0].user_id;
        console.log(`✅ Đã tạo user mẫu: @${u.username}`);
      } else {
        userId = check.rows[0].user_id;
        await client.query(
          `UPDATE users SET bio = $1, profile_photo_url = $2, creator_type = $3, is_verified = $4, open_for_collab = $5 WHERE user_id = $6`,
          [u.bio, u.avatar, u.creator_type, u.is_verified, u.open_for_collab, userId]
        );
        console.log(`ℹ️ Đã cập nhật user: @${u.username}`);
      }
      userMap[u.username] = userId;
    }

    // 2. Nạp Dự án Behance (post_type = 'project')
    for (const p of MOCK_PROJECTS) {
      const userId = userMap[p.authorUsername];
      if (!userId) continue;

      const check = await client.query('SELECT post_id FROM post WHERE user_id = $1 AND title = $2', [userId, p.title]);
      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO post (user_id, caption, photo_url, post_type, title, category, tools_used, project_images, views_count, created_at)
           VALUES ($1, $2, $3, 'project', $4, $5, $6, $7, $8, NOW())`,
          [
            userId,
            p.caption,
            p.photo_url,
            p.title,
            p.category,
            JSON.stringify(p.tools_used),
            JSON.stringify(p.project_images),
            p.views_count
          ]
        );
        console.log(`🎨 Đã đăng dự án: "${p.title}"`);
      }
    }

    // 3. Nạp Bài viết MXH thường (post_type = 'social') cho /feed
    for (const sp of MOCK_SOCIAL_POSTS) {
      const userId = userMap[sp.authorUsername];
      if (!userId) continue;

      const check = await client.query('SELECT post_id FROM post WHERE user_id = $1 AND caption = $2', [userId, sp.caption]);
      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO post (user_id, caption, photo_url, post_type, created_at)
           VALUES ($1, $2, $3, 'social', NOW())`,
          [userId, sp.caption, sp.photo_url]
        );
        console.log(`📰 Đã đăng bài viết xã hội cho: @${sp.authorUsername}`);
      }
    }

    // 4. Nạp Tin tuyển dụng & Tìm kiếm NST (creator_collaborations)
    for (const c of MOCK_COLLABORATIONS) {
      const userId = userMap[c.authorUsername];
      if (!userId) continue;

      const check = await client.query('SELECT id FROM creator_collaborations WHERE user_id = $1 AND title = $2', [userId, c.title]);
      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO creator_collaborations (user_id, title, category, budget, deadline, job_type, description, skills_required, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', NOW())`,
          [
            userId,
            c.title,
            c.category,
            c.budget,
            c.deadline,
            c.job_type,
            c.description,
            JSON.stringify(c.skills_required)
          ]
        );
        console.log(`💼 Đã đăng tin tìm NST: "${c.title}"`);
      }
    }

    console.log('🎉 TOÀN BỘ DỮ LIỆU MẪU ĐÃ ĐƯỢC NẠP THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedData();
