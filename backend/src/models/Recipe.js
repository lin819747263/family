const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Recipe', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    name: { type: DataTypes.STRING(100), allowNull: false, comment: '菜谱名称' },
    description: { type: DataTypes.TEXT, comment: '简介描述' },
    image: { type: DataTypes.STRING(255), comment: '封面图片URL' },
    ingredients: { type: DataTypes.JSON, comment: '材料列表 [{name, amount}]' },
    steps: { type: DataTypes.JSON, comment: '步骤列表 [{text, image}]' },
    cookingTime: { type: DataTypes.INTEGER, comment: '烹饪时长(分钟)', field: 'cooking_time' },
    servings: { type: DataTypes.INTEGER, comment: '几人份' },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
      comment: '难度'
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, { tableName: 'recipes', underscored: true, indexes: [{ fields: ['family_id', 'status'] }] });
};
