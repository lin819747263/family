const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Space', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '空间名称' },
    icon: { type: DataTypes.STRING(50), comment: '空间图标' },
    level: { type: DataTypes.ENUM('home', 'room', 'cabinet', 'drawer'), allowNull: false, comment: '层级:家/房间/柜子/抽屉' },
    parentId: { type: DataTypes.INTEGER, allowNull: true, field: 'parent_id' },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    sort: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { tableName: 'spaces', underscored: true, indexes: [{ fields: ['family_id'] }, { fields: ['parent_id'] }] });
};
