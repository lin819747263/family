const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Manual', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '物品名称' },
    modelNo: { type: DataTypes.STRING(100), field: 'model_no', comment: '品牌型号' },
    category: { type: DataTypes.STRING(50), comment: '分类' },
    purchaseDate: { type: DataTypes.DATEONLY, field: 'purchase_date', comment: '购买日期' },
    warrantyMonths: { type: DataTypes.INTEGER, field: 'warranty_months', comment: '保修期(月)' },
    warrantyEnd: { type: DataTypes.DATEONLY, field: 'warranty_end', comment: '保修截止' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'manuals', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
