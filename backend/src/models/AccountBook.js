const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AccountBook', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '账本名称' },
    type: { type: DataTypes.ENUM('family', 'personal'), defaultValue: 'family', comment: '账本类型' },
    description: { type: DataTypes.STRING(500), comment: '账本描述' },
    icon: { type: DataTypes.STRING(50), defaultValue: 'book', comment: '账本图标' },
    familyId: { type: DataTypes.INTEGER, allowNull: true, field: 'family_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
    status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' }
  }, { tableName: 'account_books', underscored: true, indexes: [{ fields: ['family_id'] }, { fields: ['user_id'] }] });
};
