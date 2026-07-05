const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    type: { type: DataTypes.STRING(50), comment: '通知类型:budget_warning/expiry/reminder' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.STRING(1000) },
    relatedId: { type: DataTypes.INTEGER, field: 'related_id' },
    relatedType: { type: DataTypes.STRING(50), field: 'related_type' },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' }
  }, { tableName: 'notifications', underscored: true, indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['related_id', 'related_type'] }
  ] });
};
