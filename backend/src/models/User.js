const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: '用户名' },
    password: { type: DataTypes.STRING(255), allowNull: false, comment: '密码(加密)' },
    nickname: { type: DataTypes.STRING(50), comment: '昵称' },
    avatar: { type: DataTypes.STRING(500), comment: '头像URL' },
    email: { type: DataTypes.STRING(100), comment: '邮箱' },
    phone: { type: DataTypes.STRING(20), comment: '手机号' },
    role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member', comment: '角色' },
    theme: { type: DataTypes.ENUM('light', 'dark'), defaultValue: 'light', comment: '主题偏好' },
    fontSize: { type: DataTypes.ENUM('normal', 'large'), defaultValue: 'normal', comment: '字体大小' },
    status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' }
  }, { tableName: 'users', underscored: true });
  return User;
};
