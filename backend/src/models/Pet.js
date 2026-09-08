const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Pet', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(50), allowNull: false, comment: '宠物名' },
    emoji: { type: DataTypes.STRING(10), defaultValue: '🐱', comment: '图标' },
    breed: { type: DataTypes.STRING(100), comment: '品种' },
    gender: { type: DataTypes.STRING(10), comment: '性别' },
    birthday: { type: DataTypes.DATEONLY, comment: '生日' },
    weight: { type: DataTypes.DECIMAL(5, 1), comment: '当前体重(kg)' },
    weightChange: { type: DataTypes.STRING(20), field: 'weight_change', comment: '体重变化' },
    pills: { type: DataTypes.JSON, comment: '标签 ["已绝育","已植芯片"]' },
    loves: { type: DataTypes.JSON, comment: '爱吃' },
    hates: { type: DataTypes.JSON, comment: '不吃' },
    photos: { type: DataTypes.JSON, comment: '搞笑瞬间' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'pets', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
