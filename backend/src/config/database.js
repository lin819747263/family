require('dotenv').config();

if (!process.env.DB_PASSWORD) {
  console.warn('[WARN] DB_PASSWORD 未设置，请在 .env 文件中配置');
}

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'family_home',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  dialect: 'mysql',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
};
