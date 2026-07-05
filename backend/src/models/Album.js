const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Album', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '相册名称' },
    description: { type: DataTypes.STRING(500), comment: '相册描述' },
    coverUrl: { type: DataTypes.STRING(500), field: 'cover_url', comment: '封面图片' },
    type: { type: DataTypes.ENUM('normal', 'encrypted', 'shared'), defaultValue: 'normal', comment: '相册类型' },
    password: { type: DataTypes.STRING(255), comment: '加密相册密码' },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    sort: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' }
  }, { tableName: 'albums', underscored: true, indexes: [{ fields: ['family_id'] }, { fields: ['created_by'] }] });
};
