const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('HabitRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    habitId: { type: DataTypes.INTEGER, allowNull: false, field: 'habit_id', comment: '习惯ID' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id', comment: '打卡人' },
    date: { type: DataTypes.DATEONLY, allowNull: false, comment: '打卡日期' }
  }, {
    tableName: 'habit_records',
    underscored: true,
    indexes: [
      { fields: ['habit_id', 'user_id', 'date'], unique: true },
      { fields: ['habit_id'] },
      { fields: ['date'] }
    ]
  });
};
