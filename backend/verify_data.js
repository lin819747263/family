const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('family_home', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function verify() {
  try {
    const [rows] = await sequelize.query("SELECT id, title FROM anniversaries ORDER BY id DESC LIMIT 5");
    console.log('最近5条记录:');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Title: ${row.title} (hex: ${Buffer.from(row.title).toString('hex')})`);
    });
    await sequelize.close();
  } catch (err) {
    console.error('错误:', err);
  }
}

verify();
