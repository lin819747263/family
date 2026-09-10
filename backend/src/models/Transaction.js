const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false, comment: '收支类型' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, comment: '金额' },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, field: 'category_id' },
    tags: { type: DataTypes.STRING(500), comment: '标签(逗号分隔)' },
    note: { type: DataTypes.STRING(500), comment: '备注' },
    transactionDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'transaction_date', comment: '交易日期' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    source: { type: DataTypes.ENUM('manual', 'voice', 'ocr', 'import'), defaultValue: 'manual', comment: '录入方式' },
    imageUrl: { type: DataTypes.STRING(500), field: 'image_url', comment: '小票/账单图片' },
    status: { type: DataTypes.ENUM('normal', 'deleted'), defaultValue: 'normal' }
  }, { tableName: 'transactions', underscored: true, indexes: [{ fields: ['book_id', 'transaction_date'] }, { fields: ['created_by'] }] });
};
