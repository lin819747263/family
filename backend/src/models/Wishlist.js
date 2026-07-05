const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Wishlist', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id', comment: '家庭ID' },
    title: { type: DataTypes.STRING(200), allowNull: false, comment: '心愿标题' },
    description: { type: DataTypes.TEXT, allowNull: true, comment: '心愿描述' },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url', comment: '心愿图片' },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: true, comment: '预估价格' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', comment: '优先级' },
    status: { type: DataTypes.ENUM('pending', 'fulfilled', 'cancelled'), defaultValue: 'pending', comment: '状态' },
    fulfilledAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'fulfilled_at', comment: '实现日期' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by', comment: '创建人' }
  }, { tableName: 'wishlists', underscored: true, indexes: [{ fields: ['family_id'] }, { fields: ['status'] }] });
};
