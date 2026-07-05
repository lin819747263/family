const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('WeightRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    profileId: { type: DataTypes.INTEGER, allowNull: false, field: 'profile_id' },
    weight: { type: DataTypes.DECIMAL(5, 1), allowNull: false, comment: '体重(kg)' },
    recordDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'record_date', comment: '记录日期' },
    note: { type: DataTypes.STRING(200), comment: '备注' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' }
  }, {
    tableName: 'weight_records',
    underscored: true,
    indexes: [{ fields: ['profile_id', 'record_date'] }]
  });
};
