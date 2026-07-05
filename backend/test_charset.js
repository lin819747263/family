const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('family_home', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    charset: 'utf8mb4'
  }
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('连接成功');
    
    // 测试直接插入
    const [result] = await sequelize.query(
      "INSERT INTO anniversaries (title, date, type, family_id, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      {
        replacements: ['测试中文', '2026-07-01', 'holiday', 4, 5, 'active'],
        type: Sequelize.QueryTypes.INSERT
      }
    );
    
    console.log('插入成功，ID:', result);
    
    // 查询验证
    const [rows] = await sequelize.query(
      "SELECT id, title FROM anniversaries ORDER BY id DESC LIMIT 1"
    );
    
    console.log('查询结果:', rows[0]);
    
    await sequelize.close();
  } catch (err) {
    console.error('错误:', err);
  }
}

test();
