const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Budget', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
    categoryId: { type: DataTypes.INTEGER, allowNull: true, field: 'category_id', comment: '分类ID(null表示总预算)' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, comment: '预算金额' },
    month: { type: DataTypes.STRING(7), allowNull: false, comment: '预算月份(YYYY-MM)' },
    warnPercent: { type: DataTypes.INTEGER, defaultValue: 80, field: 'warn_percent', comment: '预警百分比' }
  }, { tableName: 'budgets', underscored: true, indexes: [{ fields: ['book_id', 'month'] }] });
};
