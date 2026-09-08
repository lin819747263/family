const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('FunPlace', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '景点名称' },
    description: { type: DataTypes.TEXT, comment: '推荐理由' },
    season: { type: DataTypes.ENUM('spring', 'summer', 'autumn', 'winter', 'all'), defaultValue: 'all', comment: '适合季节' },
    distance: { type: DataTypes.STRING(50), comment: '距离' },
    duration: { type: DataTypes.STRING(50), comment: '游玩时长' },
    fee: { type: DataTypes.STRING(50), comment: '费用' },
    tags: { type: DataTypes.JSON, comment: '标签 ["亲子","免门票"]' },
    isWish: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_wish', comment: '想去' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'fun_places', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
