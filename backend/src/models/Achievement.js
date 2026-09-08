const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Achievement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    profileId: { type: DataTypes.INTEGER, field: 'profile_id', comment: '归属成员' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '成就标题' },
    description: { type: DataTypes.TEXT, comment: '小故事' },
    icon: { type: DataTypes.STRING(10), defaultValue: '🎉', comment: '图标' },
    category: { type: DataTypes.STRING(50), comment: '分类' },
    achievedDate: { type: DataTypes.STRING(10), field: 'achieved_date', comment: '日期(YYYY-MM)' },
    isGold: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_gold', comment: '金色成就' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'achievements', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
