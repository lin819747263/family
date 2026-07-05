const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Todo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '待办标题' },
    description: { type: DataTypes.TEXT, comment: '详细描述' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', comment: '优先级' },
    dueDate: { type: DataTypes.DATEONLY, field: 'due_date', comment: '截止日期' },
    dueTime: { type: DataTypes.STRING(5), field: 'due_time', comment: '截止时间(HH:mm)' },
    reminderBefore: { type: DataTypes.INTEGER, defaultValue: 0, field: 'reminder_before', comment: '提前提醒分钟数(0=不提醒)' },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否完成' },
    completedAt: { type: DataTypes.DATE, field: 'completed_at', comment: '完成时间' },
    archived: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否归档' },
    archivedAt: { type: DataTypes.DATE, field: 'archived_at', comment: '归档时间' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, {
    tableName: 'todos',
    underscored: true,
    indexes: [
      { fields: ['family_id', 'status', 'archived'] },
      { fields: ['due_date'] },
      { fields: ['completed', 'status'] }
    ]
  });
};
