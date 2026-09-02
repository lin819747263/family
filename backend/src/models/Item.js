const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Item', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '物品名称' },
    description: { type: DataTypes.STRING(1000), comment: '物品描述' },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, comment: '数量' },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 9.9, comment: '购买价格' },
    purchaseDate: { type: DataTypes.DATEONLY, field: 'purchase_date', comment: '购买日期' },
    warrantyMonths: { type: DataTypes.INTEGER, field: 'warranty_months', comment: '保修月数' },
    productionDate: { type: DataTypes.DATEONLY, field: 'production_date', comment: '生产日期' },
    shelfLife: { type: DataTypes.INTEGER, field: 'shelf_life', comment: '保质期(月)' },
    expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date', comment: '过期日期(食品等)' },
    category: { type: DataTypes.STRING(50), comment: '物品分类' },
    tags: { type: DataTypes.STRING(500), comment: '标签' },
    spaceId: { type: DataTypes.INTEGER, field: 'space_id' },
    photos: { type: DataTypes.TEXT, comment: '关联照片URL(JSON数组)' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'discarded', 'donated', 'sold'), defaultValue: 'active', comment: '状态' },
    lastUsedDate: { type: DataTypes.DATEONLY, field: 'last_used_date', comment: '最后使用日期' }
  }, { tableName: 'items', underscored: true, indexes: [{ fields: ['status'] }, { fields: ['expiry_date'] }, { fields: ['space_id'] }] });
};
