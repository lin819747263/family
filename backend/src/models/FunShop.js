const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('FunShop', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '店名' },
    category: { type: DataTypes.STRING(50), comment: '分类' },
    address: { type: DataTypes.STRING(255), comment: '地址' },
    rating: { type: DataTypes.INTEGER, defaultValue: 5, comment: '评分1-5' },
    checkedIn: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'checked_in', comment: '已打卡' },
    checkedAt: { type: DataTypes.DATE, field: 'checked_at', comment: '打卡时间' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'fun_shops', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
