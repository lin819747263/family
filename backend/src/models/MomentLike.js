const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('MomentLike', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    momentId: { type: DataTypes.INTEGER, allowNull: false, field: 'moment_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' }
  }, {
    tableName: 'moment_likes',
    underscored: true,
    indexes: [{ unique: true, fields: ['moment_id', 'user_id'] }]
  });
};
