const express = require('express');
const app = express();

app.use(express.json());

app.post('/test', (req, res) => {
  console.log('收到数据:', req.body);
  console.log('Title hex:', Buffer.from(req.body.title).toString('hex'));
  res.json({ received: req.body.title });
});

app.listen(3001, () => {
  console.log('测试服务器运行在端口 3001');
});
