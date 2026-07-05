module.exports = (err, req, res, _next) => {
  console.error('Error:', err);
  if (err.name === 'ValidationError') return res.status(400).json({ code: 400, message: err.message });
  if (err.name === 'UnauthorizedError') return res.status(401).json({ code: 401, message: '未授权' });
  if (err.name === 'ForbiddenError') return res.status(403).json({ code: 403, message: '无权限' });
  if (err.name === 'NotFoundError') return res.status(404).json({ code: 404, message: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 413, message: '文件大小超出限制' });
  return res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误' });
};
