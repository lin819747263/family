const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Anniversary', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    title: { type: DataTypes.STRING(100), allowNull: false, comment: '纪念日名称' },
    date: { type: DataTypes.DATEONLY, allowNull: false, comment: '日期' },
    type: {
      type: DataTypes.ENUM('birthday', 'anniversary', 'holiday', 'countdown', 'other'),
      defaultValue: 'other',
      comment: '类型'
    },
    icon: { type: DataTypes.STRING(50), defaultValue: 'Calendar', comment: '图标名' },
    color: { type: DataTypes.STRING(20), defaultValue: '#667eea', comment: '主题色' },
    calendarType: { type: DataTypes.ENUM('solar', 'lunar'), defaultValue: 'solar', field: 'calendar_type', comment: '历法:公历/农历' },
    lunarDate: { type: DataTypes.STRING(20), field: 'lunar_date', comment: '农历日期(lunar时存储,格式:MM-DD或闰月标记)' },
    repeatYearly: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'repeat_yearly', comment: '每年重复' },
    reminderDays: { type: DataTypes.INTEGER, defaultValue: 3, field: 'reminder_days', comment: '提前提醒天数' },
    note: { type: DataTypes.STRING(500), comment: '备注' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'anniversaries', underscored: true, indexes: [
    { fields: ['date'] },
    { fields: ['family_id', 'status'] }
  ] });
};
