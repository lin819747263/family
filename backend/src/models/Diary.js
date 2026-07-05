const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Diary', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id', comment: '家庭ID' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '日记标题' },
    content: { type: DataTypes.TEXT, allowNull: false, comment: '日记内容(Markdown)' },
    mood: { type: DataTypes.STRING(20), allowNull: true, comment: '心情' },
    weather: { type: DataTypes.STRING(20), allowNull: true, comment: '天气' },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_public', comment: '是否公开' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by', comment: '作者' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'diaries', underscored: true, indexes: [
    { fields: ['family_id', 'created_at'] },
    { fields: ['created_by'] }
  ] });
};
