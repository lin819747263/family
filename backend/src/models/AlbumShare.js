const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AlbumShare', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    albumId: { type: DataTypes.INTEGER, allowNull: false, field: 'album_id' },
    sharedWith: { type: DataTypes.INTEGER, allowNull: false, field: 'shared_with' },
    permission: { type: DataTypes.ENUM('view', 'comment', 'upload'), defaultValue: 'view', comment: '权限' },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' }
  }, { tableName: 'album_shares', underscored: true, indexes: [{ unique: true, fields: ['album_id', 'shared_with'] }] });
};
