# 家庭管家 (Family Home)

面向中国家庭的私有化/轻量级家庭管理 Web 应用，一站式解决家庭财务、照片、物品管理、日程提醒等核心需求。暖色居家设计风格，支持主题切换。

## 功能模块

### 1. 智能记账
- **多账本体系**：支持家庭公共账本 + 个人私密账本，权限隔离
- **快捷录入**：首页一键记账，支持单笔/批量模式，语音/图片识别
- **账单导入**：支持微信账单（.xlsx）和支付宝账单（.csv）导入，逐条审核后批量入库
- **分类与标签**：预设家庭高频分类（餐饮/教育/医疗/住房/人情），支持二级分类
- **预算管理**：按月/按分类设置预算，超支实时预警
- **可视化报表**：月度收支趋势图、分类占比饼图、年度同比分析，支持导出 Excel/PDF
- **周期性账单**：自动提醒固定支出（物业费、保险、订阅服务）

### 2. 家庭提醒
- **待办清单**：家庭任务管理，支持优先级、到期日、提醒、重复
- **日历视图**：家庭日程一览，待办/纪念日/生日统一展示
- **纪念日管理**：生日、结婚纪念日等重要日期，支持农历、提前提醒
- **年度目标**：设定年度目标，拆解里程碑，进度自动计算（完成里程碑数/总数）
- **习惯打卡**：每日习惯打卡，连续天数统计，热力图可视化，支持自定义频率
- **家庭心愿**：想做的事、想买的东西，家庭共享心愿池

### 3. 家庭相册
- **智能分类**：按相册、时间线管理家庭照片
- **隐私保护**：支持加密相册（二次验证），敏感照片保护
- **共享与协作**：家庭成员可创建共享相册
- **存储空间管理**：显示各成员占用空间
- **回忆推送**：N年前的今天、本周最佳照片等情感化内容

### 4. 物品管理
- **空间建模**：以"家→房间→柜子→抽屉"层级建模
- **物品档案**：记录名称、数量、购买日期、价格、保修期、存放位置
- **智能搜索**：支持模糊搜索，按位置/分类/标签筛选
- **临期/保修提醒**：食品保质期、电器保修到期前推送提醒
- **借物追踪**：记录借出对象、借出时间，支持一键催还
- **断舍离助手**：统计超过指定月数未使用的物品

### 5. 吃喝玩乐
- **奶茶收藏**：记录喜欢的奶茶配方和口味
- **打卡小店**：收藏想去/去过的小店
- **出游景点**：记录旅行目的地和游记
- **时令水果**：记录当季水果和购买渠道

### 6. 更多功能
- **家庭菜谱**：收藏和管理家庭菜谱，支持随机推荐"今天吃什么"
- **家庭日记**：记录家庭日常点滴
- **成员档案**：家庭成员个人信息、健康数据（体重/身高记录）
- **成就系统**：家庭成就徽章，激励家庭互动
- **情绪打卡**：记录每日心情，追踪情绪变化
- **时间轴**：家庭大事记时间线
- **AI 助手**：智能对话，辅助记账和日程管理
- **主题切换**：支持浅色/深色/暖色等多种主题

### 7. 系统管理
- **家庭管理**：邀请码加入家庭，成员角色管理
- **数据备份**：支持数据导出和备份
- **权限控制**：家庭/个人数据隔离，管理员认证

## 技术栈

- **前端**：Vue 3 + Vite + Element Plus + ECharts + Pinia
- **后端**：Node.js + Express + Sequelize (ORM)
- **数据库**：MySQL 8.0
- **部署**：Docker / Docker Compose

## 快速开始

### 方式一：Docker 一键部署（推荐）

```bash
cd docker
docker-compose up -d
```

### 方式二：手动本地开发

1. 初始化数据库：执行 `docker/mysql/init.sql`
2. 启动后端：`cd backend && npm install && cp .env.example .env && npm run dev`
3. 启动前端：`cd frontend && pnpm install && pnpm dev`

## 项目结构

```
family-home/
├── frontend/                    # 前端 Vue 3 + Vite
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   │   ├── dashboard/       # 首页仪表盘
│   │   │   ├── accounting/      # 记账模块
│   │   │   ├── reminder/        # 家庭提醒（待办/日历/纪念日/目标/习惯/心愿）
│   │   │   ├── album/           # 家庭相册
│   │   │   ├── inventory/       # 物品管理
│   │   │   ├── fun/             # 吃喝玩乐
│   │   │   ├── recipe/          # 家庭菜谱
│   │   │   ├── diary/           # 家庭日记
│   │   │   └── member/          # 成员档案
│   │   ├── components/          # 公共组件
│   │   ├── api/                 # API 接口层
│   │   ├── store/               # Pinia 状态管理
│   │   ├── router/              # 路由配置
│   │   └── utils/               # 工具函数
│   └── prototype-*.html         # UI 原型文件
├── backend/                     # 后端 Node.js + Express
│   └── src/
│       ├── controllers/         # 控制器
│       ├── models/              # 数据模型
│       ├── routes/              # 路由定义
│       └── middleware/          # 中间件
└── docker/                      # Docker 部署配置
```

## API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | POST /api/auth/login | 用户登录 |
| 认证 | POST /api/auth/register | 用户注册 |
| 记账 | GET /api/accounting/transactions | 交易流水 |
| 记账 | POST /api/accounting/transactions | 新增交易 |
| 记账 | POST /api/accounting/transactions/import | 批量导入账单 |
| 记账 | POST /api/accounting/budgets | 设置预算 |
| 记账 | GET /api/accounting/report/monthly | 月度报表 |
| 相册 | GET /api/album/albums | 获取相册列表 |
| 相册 | POST /api/album/photos/upload | 上传照片 |
| 物品 | GET /api/inventory/items | 物品列表 |
| 物品 | POST /api/inventory/spaces | 创建空间 |
| 待办 | GET /api/todo | 待办列表 |
| 待办 | POST /api/todo | 创建待办 |
| 纪念日 | GET /api/anniversary | 纪念日列表 |
| 年度目标 | GET /api/annual-goals | 目标列表 |
| 年度目标 | POST /api/annual-goals/:id/milestones | 添加里程碑 |
| 习惯打卡 | GET /api/habits | 习惯列表 |
| 习惯打卡 | POST /api/habits/:id/check | 打卡/取消打卡 |
| 心愿 | GET /api/wishlist | 心愿列表 |
| 菜谱 | GET /api/recipe | 菜谱列表 |
| 日记 | GET /api/diary | 日记列表 |
| 吃喝玩乐 | GET /api/drink | 奶茶收藏 |
| 吃喝玩乐 | GET /api/fun-shop | 打卡小店 |
| 仪表盘 | GET /api/dashboard | 首页汇总数据 |
