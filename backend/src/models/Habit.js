const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Habit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id', comment: '家庭ID' },
    name: { type: DataTypes.STRING(50), allowNull: false, comment: '习惯名称' },
    icon: { type: DataTypes.STRING(10), defaultValue: '🏃', comment: '图标emoji' },
    color: { type: DataTypes.STRING(20), defaultValue: 'sage', comment: '主题色' },
    freq: { type: DataTypes.ENUM('daily', 'weekday', 'custom'), defaultValue: 'daily', comment: '频率' },
    weekdays: { type: DataTypes.JSON, allowNull: true, comment: '自定义打卡日 [1-7]' },
    remindTime: { type: DataTypes.STRING(10), allowNull: true, field: 'remind_time', comment: '提醒时间 HH:mm' },
    goalDays: { type: DataTypes.INTEGER, allowNull: true, field: 'goal_days', comment: '目标连续天数' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active', comment: '状态' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by', comment: '创建人' }
  }, {
    tableName: 'habits',
    underscored: true,
    indexes: [{ fields: ['family_id'] }, { fields: ['status'] }]
  });
};
