const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Moment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    content: { type: DataTypes.TEXT, comment: '文字内容' },
    images: { type: DataTypes.TEXT, comment: '图片URL数组(JSON)' },
    location: { type: DataTypes.STRING(200), comment: '发布地点' },
    mood: { type: DataTypes.STRING(20), comment: '心情标签' },
    likeCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'like_count' },
    commentCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'comment_count' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'moments', underscored: true, indexes: [{ fields: ['family_id', 'status'] }, { fields: ['created_at'] }] });
};
