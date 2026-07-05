const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('MemberProfile', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    familyId: { type: DataTypes.INTEGER, allowNull: false, field: 'family_id' },
    userId: { type: DataTypes.INTEGER, field: 'user_id', comment: '关联用户(可选,非注册成员可为空)' },
    name: { type: DataTypes.STRING(50), allowNull: false, comment: '姓名' },
    avatar: { type: DataTypes.STRING(500), comment: '头像URL' },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), comment: '性别' },
    birthday: { type: DataTypes.DATEONLY, comment: '生日' },
    height: { type: DataTypes.DECIMAL(5, 1), comment: '身高(cm)' },
    bloodType: { type: DataTypes.STRING(5), field: 'blood_type', comment: '血型' },
    phone: { type: DataTypes.STRING(20), comment: '联系电话' },
    favoriteFoods: { type: DataTypes.TEXT, field: 'favorite_foods', comment: '爱吃的食物(JSON数组)' },
    dislikedFoods: { type: DataTypes.TEXT, field: 'disliked_foods', comment: '不爱吃的食物(JSON数组)' },
    hobbies: { type: DataTypes.TEXT, comment: '爱好(JSON数组)' },
    allergies: { type: DataTypes.TEXT, comment: '过敏信息(JSON数组)' },
    notes: { type: DataTypes.TEXT, comment: '备注' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' }
  }, {
    tableName: 'member_profiles',
    underscored: true,
    indexes: [{ fields: ['family_id', 'status'] }, { fields: ['user_id'] }]
  });
};
