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
    // 重复提醒字段
    repeatType: { type: DataTypes.ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'workdays', 'custom'), defaultValue: 'none', field: 'repeat_type', comment: '重复类型' },
    repeatInterval: { type: DataTypes.INTEGER, defaultValue: 1, field: 'repeat_interval', comment: '重复间隔' },
    repeatUnit: { type: DataTypes.ENUM('days', 'weeks', 'months', 'years'), defaultValue: 'days', field: 'repeat_unit', comment: '重复单位' },
    repeatWeekdays: { type: DataTypes.JSON, field: 'repeat_weekdays', comment: '每周重复日(0-6,JSON数组)' },
    repeatDayOfMonth: { type: DataTypes.INTEGER, defaultValue: 1, field: 'repeat_day_of_month', comment: '每月重复日(1-31,-1=最后一天)' },
    repeatEndType: { type: DataTypes.ENUM('never', 'count', 'date'), defaultValue: 'never', field: 'repeat_end_type', comment: '结束重复类型' },
    repeatCount: { type: DataTypes.INTEGER, defaultValue: 10, field: 'repeat_count', comment: '重复次数' },
    repeatEndDate: { type: DataTypes.DATEONLY, field: 'repeat_end_date', comment: '结束重复日期' },
    repeatCurrentCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'repeat_current_count', comment: '当前已重复次数' },
    parentTodoId: { type: DataTypes.INTEGER, field: 'parent_todo_id', comment: '父待办ID(重复生成的子待办)' },
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
