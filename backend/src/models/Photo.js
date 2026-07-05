const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Photo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    albumId: { type: DataTypes.INTEGER, allowNull: false, field: 'album_id' },
    originalName: { type: DataTypes.STRING(255), field: 'original_name', comment: '原始文件名' },
    url: { type: DataTypes.STRING(500), allowNull: false, comment: '图片URL' },
    thumbnailUrl: { type: DataTypes.STRING(500), field: 'thumbnail_url', comment: '缩略图URL' },
    width: { type: DataTypes.INTEGER },
    height: { type: DataTypes.INTEGER },
    size: { type: DataTypes.BIGINT, comment: '文件大小(字节)' },
    mimeType: { type: DataTypes.STRING(50), field: 'mime_type' },
    location: { type: DataTypes.STRING(200), comment: '拍摄地点' },
    latitude: { type: DataTypes.DECIMAL(10, 7) },
    longitude: { type: DataTypes.DECIMAL(10, 7) },
    takenAt: { type: DataTypes.DATE, field: 'taken_at', comment: '拍摄时间' },
    uploadedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'uploaded_by' },
    faceInfo: { type: DataTypes.TEXT, comment: '人脸信息(JSON)' },
    isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_encrypted' },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_deleted' }
  }, { tableName: 'photos', underscored: true, indexes: [
    { fields: ['album_id', 'is_deleted'] }
  ] });
};
