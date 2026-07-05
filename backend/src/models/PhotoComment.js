const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('PhotoComment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    photoId: { type: DataTypes.INTEGER, allowNull: false, field: 'photo_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    content: { type: DataTypes.STRING(500), allowNull: false }
  }, { tableName: 'photo_comments', underscored: true, indexes: [{ fields: ['photo_id'] }] });
};
