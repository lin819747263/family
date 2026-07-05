const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('SystemSetting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true, comment: '设置键名' },
    value: { type: DataTypes.TEXT, allowNull: true, comment: '设置值' },
    description: { type: DataTypes.STRING(200), allowNull: true, comment: '设置说明' }
  }, { tableName: 'system_settings', underscored: true });
};
