const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const createUploader = (subDir = 'general') => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', subDir);
      // 自动创建目录
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  });
  const fileFilter = (req, file, cb) => {
    const allowedImages = /\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i;
    const allowedDocs = /\.(jpg|jpeg|png|pdf|doc|docx)$/i;
    if (subDir === 'photos' && !allowedImages.test(path.extname(file.originalname))) return cb(new Error('仅支持图片格式'));
    if (subDir === 'receipts' && !allowedDocs.test(path.extname(file.originalname))) return cb(new Error('不支持的文件格式'));
    cb(null, true);
  };
  return multer({ storage, fileFilter, limits: { fileSize: subDir === 'photos' ? 20 * 1024 * 1024 : 5 * 1024 * 1024 } });
};

module.exports = { createUploader };
