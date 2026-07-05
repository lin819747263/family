const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Investment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    platform: { type: DataTypes.STRING(100), allowNull: false, comment: '平台名称' },
    year: { type: DataTypes.INTEGER, allowNull: false, comment: '年份' },
    month: { type: DataTypes.INTEGER, allowNull: false, comment: '月份(1-12)' },
    profit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, comment: '月度盈亏(正数盈利,负数亏损)' },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, comment: '月末账户余额' },
    note: { type: DataTypes.STRING(500), comment: '备注' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' }
  }, {
    tableName: 'investments',
    underscored: true,
    indexes: [
      { fields: ['family_id', 'year', 'month'] },
      { fields: ['family_id', 'platform'] },
      { unique: true, fields: ['family_id', 'platform', 'year', 'month'] }
    ]
  });
};
