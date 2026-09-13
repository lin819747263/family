const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('GoalMilestone', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    annualGoalId: { type: DataTypes.INTEGER, allowNull: false, field: 'annual_goal_id', comment: '年度目标ID' },
    name: { type: DataTypes.STRING(200), allowNull: false, comment: '里程碑名称' },
    targetDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'target_date', comment: '目标日期' },
    done: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否完成' }
  }, {
    tableName: 'goal_milestones',
    underscored: true,
    indexes: [{ fields: ['annual_goal_id'] }]
  });
};
