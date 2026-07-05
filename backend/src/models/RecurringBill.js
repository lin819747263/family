const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('RecurringBill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '任务名称' },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    categoryId: { type: DataTypes.INTEGER, field: 'category_id' },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly',
      comment: '执行频率'
    },
    dayOfMonth: { type: DataTypes.INTEGER, field: 'day_of_month', comment: '每月几号(1-31)' },
    dayOfWeek: { type: DataTypes.INTEGER, field: 'day_of_week', comment: '每周几(0=周日,1=周一..6=周六)' },
    monthOfYear: { type: DataTypes.INTEGER, field: 'month_of_year', comment: '每年几月(1-12)' },
    triggerTime: { type: DataTypes.STRING(5), field: 'trigger_time', defaultValue: '00:00', comment: '触发时间 HH:mm' },
    startDate: { type: DataTypes.DATEONLY, field: 'start_date', comment: '生效起始日' },
    endDate: { type: DataTypes.DATEONLY, field: 'end_date', comment: '生效截止日' },
    nextRunDate: { type: DataTypes.DATEONLY, field: 'next_run_date', comment: '下次执行日期' },
    lastRunDate: { type: DataTypes.DATEONLY, field: 'last_run_date', comment: '上次执行日期' },
    totalRuns: { type: DataTypes.INTEGER, field: 'total_runs', defaultValue: 0, comment: '累计执行次数' },
    note: { type: DataTypes.STRING(500) },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'recurring_bills', underscored: true, indexes: [{ fields: ['next_run_date'] }, { fields: ['active'] }] });
};
