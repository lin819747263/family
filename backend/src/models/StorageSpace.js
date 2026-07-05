const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('StorageSpace', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    usedBytes: { type: DataTypes.BIGINT, defaultValue: 0, field: 'used_bytes' },
    totalBytes: { type: DataTypes.BIGINT, defaultValue: 1073741824, field: 'total_bytes', comment: '默认1GB' }
  }, { tableName: 'storage_spaces', underscored: true });
};
