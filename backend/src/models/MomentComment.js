const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('MomentComment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    momentId: { type: DataTypes.INTEGER, allowNull: false, field: 'moment_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    content: { type: DataTypes.STRING(1000), allowNull: false, comment: '评论内容' }
  }, { tableName: 'moment_comments', underscored: true, indexes: [{ fields: ['moment_id'] }] });
};
