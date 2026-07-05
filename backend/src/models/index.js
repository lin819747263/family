const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '+08:00',
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: {
    charset: 'utf8mb4'
  },
  define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', timestamps: true, underscored: true }
});

// 设置连接字符集
sequelize.addHook('afterConnect', (connection) => {
  connection.query('SET NAMES utf8mb4', (err) => {
    if (err) console.error('设置字符集失败:', err.message);
  });
});

const User = require('./User')(sequelize);
const Family = require('./Family')(sequelize);
const FamilyMember = require('./FamilyMember')(sequelize);
const AccountBook = require('./AccountBook')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Budget = require('./Budget')(sequelize);
const Category = require('./Category')(sequelize);
const RecurringBill = require('./RecurringBill')(sequelize);
const Album = require('./Album')(sequelize);
const Photo = require('./Photo')(sequelize);
const AlbumShare = require('./AlbumShare')(sequelize);
const PhotoComment = require('./PhotoComment')(sequelize);
const StorageSpace = require('./StorageSpace')(sequelize);
const Space = require('./Space')(sequelize);
const Item = require('./Item')(sequelize);
const ItemBorrow = require('./ItemBorrow')(sequelize);
const Notification = require('./Notification')(sequelize);
const BackupLog = require('./BackupLog')(sequelize);
const Anniversary = require('./Anniversary')(sequelize);
const Recipe = require('./Recipe')(sequelize);
const Moment = require('./Moment')(sequelize);
const MomentComment = require('./MomentComment')(sequelize);
const MomentLike = require('./MomentLike')(sequelize);
const Todo = require('./Todo')(sequelize);
const MemberProfile = require('./MemberProfile')(sequelize);
const WeightRecord = require('./WeightRecord')(sequelize);
const HeightRecord = require('./HeightRecord')(sequelize);
const Wishlist = require('./Wishlist')(sequelize);
const Diary = require('./Diary')(sequelize);
const SystemSetting = require('./SystemSetting')(sequelize);
const Investment = require('./Investment')(sequelize);

// 关联关系定义
// 家庭 - 用户
Family.belongsToMany(User, { through: FamilyMember, foreignKey: 'family_id', as: 'members' });
User.belongsToMany(Family, { through: FamilyMember, foreignKey: 'user_id', as: 'families' });
Family.hasMany(FamilyMember, { foreignKey: 'family_id' });
User.hasMany(FamilyMember, { foreignKey: 'user_id' });
FamilyMember.belongsTo(User, { foreignKey: 'user_id' });
FamilyMember.belongsTo(Family, { foreignKey: 'family_id' });

// 账本 - 家庭/用户
AccountBook.belongsTo(Family, { foreignKey: 'family_id' });
AccountBook.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
AccountBook.hasMany(Transaction, { foreignKey: 'book_id' });
AccountBook.hasMany(Budget, { foreignKey: 'book_id' });

// 交易记录
Transaction.belongsTo(AccountBook, { foreignKey: 'book_id' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 预算
Budget.belongsTo(AccountBook, { foreignKey: 'book_id' });
Budget.belongsTo(Category, { foreignKey: 'category_id' });

// 分类
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// 周期性账单
RecurringBill.belongsTo(AccountBook, { foreignKey: 'book_id' });
RecurringBill.belongsTo(Category, { foreignKey: 'category_id' });

// 相册
Album.belongsTo(Family, { foreignKey: 'family_id' });
Album.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Album.hasMany(Photo, { foreignKey: 'album_id' });
Album.hasMany(AlbumShare, { foreignKey: 'album_id' });

// 照片
Photo.belongsTo(Album, { foreignKey: 'album_id' });
Photo.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Photo.hasMany(PhotoComment, { foreignKey: 'photo_id' });
Photo.belongsToMany(User, { through: 'photo_likes', foreignKey: 'photo_id', as: 'likedBy' });

// 相册共享
AlbumShare.belongsTo(Album, { foreignKey: 'album_id' });
AlbumShare.belongsTo(User, { foreignKey: 'shared_with', as: 'sharedUser' });

// 照片评论
PhotoComment.belongsTo(Photo, { foreignKey: 'photo_id' });
PhotoComment.belongsTo(User, { foreignKey: 'user_id' });

// 存储空间
StorageSpace.belongsTo(Family, { foreignKey: 'family_id' });
StorageSpace.belongsTo(User, { foreignKey: 'user_id' });

// 空间层级
Space.belongsTo(Space, { foreignKey: 'parent_id', as: 'parent' });
Space.hasMany(Space, { foreignKey: 'parent_id', as: 'children' });
Space.belongsTo(Family, { foreignKey: 'family_id' });
Space.hasMany(Item, { foreignKey: 'space_id' });

// 物品
Item.belongsTo(Space, { foreignKey: 'space_id' });
Item.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Item.hasMany(ItemBorrow, { foreignKey: 'item_id' });

// 借物
ItemBorrow.belongsTo(Item, { foreignKey: 'item_id' });
ItemBorrow.belongsTo(User, { foreignKey: 'borrowed_by', as: 'borrower' });
ItemBorrow.belongsTo(User, { foreignKey: 'lent_by', as: 'lender' });

// 通知
Notification.belongsTo(User, { foreignKey: 'user_id' });

// 纪念日
Anniversary.belongsTo(Family, { foreignKey: 'family_id' });
Anniversary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 菜谱
Recipe.belongsTo(Family, { foreignKey: 'family_id' });
Recipe.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 精彩瞬间
Moment.belongsTo(Family, { foreignKey: 'family_id' });
Moment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Moment.hasMany(MomentComment, { foreignKey: 'moment_id' });
MomentComment.belongsTo(Moment, { foreignKey: 'moment_id' });
MomentComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// 点赞
Moment.hasMany(MomentLike, { foreignKey: 'moment_id' });
MomentLike.belongsTo(Moment, { foreignKey: 'moment_id' });
MomentLike.belongsTo(User, { foreignKey: 'user_id' });

// 待办清单
Todo.belongsTo(Family, { foreignKey: 'family_id' });
Todo.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 家庭成员档案
MemberProfile.belongsTo(Family, { foreignKey: 'family_id' });
MemberProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
MemberProfile.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
MemberProfile.hasMany(WeightRecord, { foreignKey: 'profile_id' });
MemberProfile.hasMany(HeightRecord, { foreignKey: 'profile_id' });

// 体重记录
WeightRecord.belongsTo(MemberProfile, { foreignKey: 'profile_id' });
WeightRecord.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 身高记录
HeightRecord.belongsTo(MemberProfile, { foreignKey: 'profile_id' });
HeightRecord.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 心愿清单
Wishlist.belongsTo(Family, { foreignKey: 'family_id' });
Wishlist.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 家庭日记
Diary.belongsTo(Family, { foreignKey: 'family_id' });
Diary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 理财投资
Investment.belongsTo(Family, { foreignKey: 'family_id' });
Investment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  User, Family, FamilyMember,
  AccountBook, Transaction, Budget, Category, RecurringBill,
  Album, Photo, AlbumShare, PhotoComment, StorageSpace,
  Space, Item, ItemBorrow,
  Notification, BackupLog,
  Anniversary, Recipe,
  Moment, MomentComment, MomentLike,
  Todo,
  MemberProfile, WeightRecord, HeightRecord,
  Wishlist, Diary, SystemSetting,
  Investment
};
