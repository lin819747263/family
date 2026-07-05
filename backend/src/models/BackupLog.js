const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('BackupLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fileName: { type: DataTypes.STRING(200), field: 'file_name' },
    fileSize: { type: DataTypes.BIGINT, field: 'file_size' },
    type: { type: DataTypes.ENUM('auto', 'manual'), defaultValue: 'auto' },
    status: { type: DataTypes.ENUM('success', 'failed'), defaultValue: 'success' },
    message: { type: DataTypes.STRING(500) }
  }, { tableName: 'backup_logs', underscored: true });
};
