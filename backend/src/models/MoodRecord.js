const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('MoodRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    profileId: { type: DataTypes.INTEGER, field: 'profile_id', comment: '归属成员' },
    moodIndex: { type: DataTypes.INTEGER, comment: '心情等级1-5' },
    score: { type: DataTypes.INTEGER, comment: '分数0-100' },
    tags: { type: DataTypes.JSON, comment: '标签' },
    note: { type: DataTypes.TEXT, comment: '心情日记' },
    recordDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'record_date', comment: '日期' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' }
  }, { tableName: 'mood_records', underscored: true, indexes: [{ fields: ['family_id', 'record_date'] }] });
};
