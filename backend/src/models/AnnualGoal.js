const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AnnualGoal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id', comment: '家庭ID' },
    year: { type: DataTypes.INTEGER, allowNull: false, comment: '年份' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '目标标题' },
    description: { type: DataTypes.TEXT, allowNull: true, comment: '目标描述' },
    category: { type: DataTypes.ENUM('health', 'study', 'finance', 'life', 'other'), defaultValue: 'other', comment: '分类' },
    taskType: { type: DataTypes.ENUM('maintain', 'improve'), defaultValue: 'improve', field: 'task_type', comment: '任务类型：maintain-维持，improve-精进' },
    progress: { type: DataTypes.INTEGER, defaultValue: 0, comment: '年度进度0-100' },
    q1Progress: { type: DataTypes.INTEGER, defaultValue: 0, field: 'q1_progress', comment: 'Q1进度0-100' },
    q2Progress: { type: DataTypes.INTEGER, defaultValue: 0, field: 'q2_progress', comment: 'Q2进度0-100' },
    q3Progress: { type: DataTypes.INTEGER, defaultValue: 0, field: 'q3_progress', comment: 'Q3进度0-100' },
    q4Progress: { type: DataTypes.INTEGER, defaultValue: 0, field: 'q4_progress', comment: 'Q4进度0-100' },
    status: { type: DataTypes.ENUM('active', 'completed', 'cancelled', 'deleted'), defaultValue: 'active', comment: '状态' },
    completedAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'completed_at', comment: '完成日期' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by', comment: '创建人' }
  }, {
    tableName: 'annual_goals',
    underscored: true,
    indexes: [{ fields: ['family_id'] }, { fields: ['year'] }, { fields: ['status'] }]
  });
};
