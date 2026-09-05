// File: middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Lùi ra một cấp (../) để lưu file vào thư mục gốc của dự án
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads/')),
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

module.exports = upload;    