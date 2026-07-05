const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Family', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '家庭名称' },
    description: { type: DataTypes.STRING(500), comment: '家庭简介' },
    avatar: { type: DataTypes.STRING(500), comment: '家庭头像' },
    inviteCode: { type: DataTypes.STRING(20), unique: true, comment: '邀请码' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' }
  }, { tableName: 'families', underscored: true });
};
