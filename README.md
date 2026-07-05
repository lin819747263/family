# 家庭管家 (Family Home)

面向中国家庭的私有化/轻量级家庭管理Web应用，一站式解决家庭财务、照片、物品管理三大痛点。

## 功能模块

### 1. 智能记账
- **多账本体系**：支持家庭公共账本 + 个人私密账本，权限隔离
- **快捷录入**：首页一键记账，支持分类快速选择
- **分类与标签**：预设家庭高频分类（餐饮/教育/医疗/住房/人情），支持自定义
- **预算管理**：按月/按分类设置预算，超支实时预警
- **可视化报表**：月度收支趋势图、分类占比饼图、年度同比分析，支持导出Excel/PDF
- **周期性账单**：自动提醒固定支出（物业费、保险、订阅服务）

### 2. 家庭相册
- **智能分类**：按相册、时间线管理家庭照片
- **隐私保护**：支持加密相册（二次验证），敏感照片保护
- **共享与协作**：家庭成员可创建共享相册
- **存储空间管理**：显示各成员占用空间
- **回忆推送**：N年前的今天、本周最佳照片等情感化内容

### 3. 物品管理
- **空间建模**：以"家→房间→柜子→抽屉"层级建模
- **物品档案**：记录名称、数量、购买日期、价格、保修期、存放位置
- **智能搜索**：支持模糊搜索，按位置/分类/标签筛选
- **临期/保修提醒**：食品保质期、电器保修到期前推送提醒
- **借物追踪**：记录借出对象、借出时间，支持一键催还
- **断舍离助手**：统计超过指定月数未使用的物品

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
├── frontend/          # 前端 Vue 3 + Vite
├── backend/           # 后端 Node.js + Express
└── docker/            # Docker 部署配置
```

## API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | POST /api/auth/login | 用户登录 |
| 认证 | POST /api/auth/register | 用户注册 |
| 记账 | GET /api/accounting/transactions | 交易流水 |
| 记账 | POST /api/accounting/transactions | 新增交易 |
| 记账 | POST /api/accounting/budgets | 设置预算 |
| 记账 | GET /api/accounting/report/monthly | 月度报表 |
| 相册 | GET /api/album/albums | 获取相册列表 |
| 相册 | POST /api/album/photos/upload | 上传照片 |
| 相册 | GET /api/album/memories | 回忆推送 |
| 物品 | GET /api/inventory/items | 物品列表 |
| 物品 | POST /api/inventory/spaces | 创建空间 |
| 物品 | GET /api/inventory/unused | 闲置物品分析 |
| 仪表盘 | GET /api/dashboard | 首页汇总数据 |
