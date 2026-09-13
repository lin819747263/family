const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const oss = require('../utils/oss');

async function compressImage(buffer, ext) {
  const lower = ext.toLowerCase();
  let pipeline = sharp(buffer).rotate();

  if (lower === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, palette: false });
  } else if (lower === '.webp') {
    pipeline = pipeline.webp({ lossless: true, quality: 100 });
  } else if (lower === '.jpg' || lower === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: 100, mozjpeg: true });
  } else {
    return buffer;
  }

  return pipeline.toBuffer();
}

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的文件' });
    }

    const ext = path.extname(req.file.originalname);
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.heic'];
    const isImage = imageExts.includes(ext.toLowerCase());

    let fileBuffer = fs.readFileSync(req.file.path);
    const originalSize = fileBuffer.length;

    if (isImage) {
      fileBuffer = await compressImage(fileBuffer, ext);
    }

    const config = await oss.getOSSConfig();

    if (config.oss_enabled === 'true') {
      const filename = `${uuidv4()}${ext}`;
      const dir = req.body.dir || 'images';

      const result = await oss.uploadBuffer(fileBuffer, filename, { dir });

      fs.unlink(req.file.path, () => {});

      return res.json({
        code: 0,
        data: {
          url: result.url,
          key: result.key,
          storage: 'oss',
          originalSize,
          compressedSize: fileBuffer.length,
          saved: isImage ? Math.round((1 - fileBuffer.length / originalSize) * 100) : 0
        }
      });
    }

    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', req.body.dir || 'images');
    fs.mkdirSync(uploadDir, { recursive: true });
    const outputPath = path.join(uploadDir, filename);
    fs.writeFileSync(outputPath, fileBuffer);

    fs.unlink(req.file.path, () => {});

    res.json({
      code: 0,
      data: {
        url: `/uploads/${req.body.dir || 'images'}/${filename}`,
        storage: 'local',
        originalSize,
        compressedSize: fileBuffer.length,
        saved: isImage ? Math.round((1 - fileBuffer.length / originalSize) * 100) : 0
      }
    });
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
};

exports.getConfig = async (req, res, next) => {
  try {
    const config = await oss.getOSSConfig();
    res.json({
      code: 0,
      data: {
        enabled: config.oss_enabled === 'true',
        customDomain: config.oss_custom_domain || null
      }
    });
  } catch (err) {
    next(err);
  }
};
