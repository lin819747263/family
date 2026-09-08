const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Drink', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '饮品名称' },
    brand: { type: DataTypes.STRING(100), comment: '品牌' },
    tags: { type: DataTypes.JSON, comment: '标签 ["少糖","去冰"]' },
    sugar: { type: DataTypes.STRING(20), comment: '糖度' },
    ice: { type: DataTypes.STRING(20), comment: '冰量' },
    note: { type: DataTypes.TEXT, comment: '备注' },
    likes: { type: DataTypes.INTEGER, defaultValue: 0, comment: '点赞数' },
    isFav: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_fav', comment: '是否收藏' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'drinks', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
