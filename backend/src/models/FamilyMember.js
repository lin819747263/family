const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('FamilyMember', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    role: { type: DataTypes.ENUM('owner', 'admin', 'member'), defaultValue: 'member', comment: '家庭角色' },
    nickname: { type: DataTypes.STRING(50), comment: '家庭内昵称' },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'joined_at' }
  }, { tableName: 'family_members', underscored: true, indexes: [{ unique: true, fields: ['family_id', 'user_id'] }] });
};
