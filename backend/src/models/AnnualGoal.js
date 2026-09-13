const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AnnualGoal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id', comment: '家庭ID' },
    year: { type: DataTypes.INTEGER, allowNull: false, comment: '年份' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '目标标题' },
    description: { type: DataTypes.TEXT, allowNull: true, comment: '目标描述' },
    category: { type: DataTypes.ENUM('health', 'study', 'finance', 'life', 'other'), defaultValue: 'other', comment: '分类' },
    startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date', comment: '开始日期' },
    endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date', comment: '结束日期' },
    progress: { type: DataTypes.INTEGER, defaultValue: 0, comment: '年度进度0-100' },
    status: { type: DataTypes.ENUM('active', 'completed', 'cancelled', 'deleted'), defaultValue: 'active', comment: '状态' },
    completedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'completed_at', comment: '完成日期' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by', comment: '创建人' }
  }, {
    tableName: 'annual_goals',
    underscored: true,
    indexes: [{ fields: ['family_id'] }, { fields: ['year'] }, { fields: ['status'] }]
  });
};
