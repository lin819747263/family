const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, comment: '分类名称' },
    icon: { type: DataTypes.STRING(50), comment: '分类图标' },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false, comment: '收支类型' },
    parentId: { type: DataTypes.INTEGER, allowNull: true, field: 'parent_id', comment: '父分类ID' },
    sort: { type: DataTypes.INTEGER, defaultValue: 0, comment: '排序' },
    builtIn: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'built_in', comment: '是否预设分类' },
    familyId: { type: DataTypes.INTEGER, allowNull: true, field: 'family_id', comment: '家庭ID(自定义分类)' }
  }, { tableName: 'categories', underscored: true, indexes: [{ fields: ['family_id', 'type'] }] });
};
