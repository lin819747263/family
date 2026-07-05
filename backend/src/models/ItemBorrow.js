const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ItemBorrow', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    itemId: { type: DataTypes.INTEGER, allowNull: false, field: 'item_id' },
    borrowedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'borrowed_by', comment: '借用人' },
    lentBy: { type: DataTypes.INTEGER, allowNull: false, field: 'lent_by', comment: '出借人' },
    borrowDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'borrow_date', comment: '借出日期' },
    expectedReturnDate: { type: DataTypes.DATEONLY, field: 'expected_return_date', comment: '预计归还日期' },
    returnDate: { type: DataTypes.DATEONLY, field: 'return_date', comment: '实际归还日期' },
    note: { type: DataTypes.STRING(500), comment: '备注' },
    status: { type: DataTypes.ENUM('borrowed', 'returned', 'overdue'), defaultValue: 'borrowed' }
  }, { tableName: 'item_borrows', underscored: true, indexes: [{ fields: ['status'] }, { fields: ['borrowed_by'] }, { fields: ['expected_return_date'] }] });
};
