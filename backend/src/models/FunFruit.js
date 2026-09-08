const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('FunFruit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(50), allowNull: false, comment: '水果名称' },
    emoji: { type: DataTypes.STRING(10), comment: '图标' },
    seasonFrom: { type: DataTypes.INTEGER, field: 'season_from', comment: '当季开始月1-12' },
    seasonTo: { type: DataTypes.INTEGER, field: 'season_to', comment: '当季结束月1-12' },
    sweetness: { type: DataTypes.INTEGER, defaultValue: 3, comment: '甜度1-5' },
    price: { type: DataTypes.STRING(30), comment: '参考价格' },
    tip: { type: DataTypes.TEXT, comment: '挑选技巧' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'fun_fruits', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
