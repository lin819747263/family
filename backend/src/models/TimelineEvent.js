const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('TimelineEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    profileId: { type: DataTypes.INTEGER, field: 'profile_id', comment: '归属成员(null=全家)' },
    year: { type: DataTypes.INTEGER, allowNull: false, comment: '年份' },
    month: { type: DataTypes.INTEGER, comment: '月份' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '标题' },
    description: { type: DataTypes.TEXT, comment: '描述' },
    icon: { type: DataTypes.STRING(10), defaultValue: '🎉', comment: '图标' },
    eventType: { type: DataTypes.STRING(30), field: 'event_type', comment: '事件类型' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'timeline_events', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
