/**
 * 输入验证中间件
 * 使用 express-validator 对关键接口参数做校验
 */
const { body, param, query, validationResult } = require('express-validator');

/**
 * 统一处理验证结果
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: errors.array().map(e => e.msg).join('；')
    });
  }
  next();
};

// ===== 认证 =====
const authValidators = {
  register: [
    body('username').trim().notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 20 }).withMessage('用户名长度 2-20 个字符'),
    body('password').notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6, max: 50 }).withMessage('密码长度 6-50 个字符'),
    body('nickname').optional().trim().isLength({ max: 20 }).withMessage('昵称最多 20 个字符'),
    validate
  ],
  login: [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
    validate
  ],
  changePassword: [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 6, max: 50 }).withMessage('新密码长度 6-50 个字符'),
    validate
  ],
  createFamily: [
    body('name').trim().notEmpty().withMessage('家庭名称不能为空')
      .isLength({ max: 30 }).withMessage('家庭名称最多 30 个字符'),
    validate
  ],
  joinFamily: [
    body('inviteCode').trim().notEmpty().withMessage('邀请码不能为空'),
    validate
  ]
};

// ===== 记账 =====
const accountingValidators = {
  createBook: [
    body('name').trim().notEmpty().withMessage('账本名称不能为空')
      .isLength({ max: 30 }).withMessage('账本名称最多 30 个字符'),
    body('type').optional().isIn(['family', 'personal']).withMessage('账本类型只能是 family 或 personal'),
    validate
  ],
  createTransaction: [
    body('type').isIn(['income', 'expense']).withMessage('交易类型只能是 income 或 expense'),
    body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于 0'),
    body('categoryId').optional({ nullable: true }),
    body('bookId').notEmpty().withMessage('账本 ID 不能为空'),
    body('transactionDate').optional().isDate().withMessage('日期格式不正确'),
    validate
  ],
  createCategory: [
    body('name').trim().notEmpty().withMessage('分类名称不能为空')
      .isLength({ max: 20 }).withMessage('分类名称最多 20 个字符'),
    body('type').isIn(['income', 'expense']).withMessage('分类类型只能是 income 或 expense'),
    validate
  ],
  setBudget: [
    body('amount').isFloat({ gt: 0 }).withMessage('预算金额必须大于 0'),
    body('bookId').notEmpty().withMessage('账本 ID 不能为空'),
    body('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('月份格式应为 YYYY-MM'),
    validate
  ],
  createRecurringBill: [
    body('name').trim().notEmpty().withMessage('账单名称不能为空'),
    body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于 0'),
    body('type').isIn(['income', 'expense']).withMessage('类型只能是 income 或 expense'),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('频率不合法'),
    validate
  ]
};

// ===== 相册 =====
const albumValidators = {
  createAlbum: [
    body('name').trim().notEmpty().withMessage('相册名称不能为空')
      .isLength({ max: 50 }).withMessage('相册名称最多 50 个字符'),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('描述最多 200 个字符'),
    validate
  ],
  addComment: [
    body('photoId').notEmpty().withMessage('照片 ID 不能为空'),
    body('content').trim().notEmpty().withMessage('评论内容不能为空')
      .isLength({ max: 500 }).withMessage('评论最多 500 个字符'),
    validate
  ]
};

// ===== 物品管理 =====
const inventoryValidators = {
  createSpace: [
    body('name').trim().notEmpty().withMessage('空间名称不能为空')
      .isLength({ max: 30 }).withMessage('空间名称最多 30 个字符'),
    validate
  ],
  createItem: [
    body('name').trim().notEmpty().withMessage('物品名称不能为空')
      .isLength({ max: 50 }).withMessage('物品名称最多 50 个字符'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('数量不能为负数'),
    body('price').optional().isFloat({ min: 0 }).withMessage('价格不能为负数'),
    validate
  ],
  createBorrow: [
    body('itemId').notEmpty().withMessage('物品 ID 不能为空'),
    body('borrowedBy').notEmpty().withMessage('借用人不能为空'),
    validate
  ]
};

// ===== 待办 =====
const todoValidators = {
  create: [
    body('title').trim().notEmpty().withMessage('待办标题不能为空')
      .isLength({ max: 100 }).withMessage('标题最多 100 个字符'),
    body('dueDate').optional().isDate().withMessage('日期格式不正确'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('优先级不合法'),
    validate
  ]
};

// ===== 纪念日 =====
const anniversaryValidators = {
  create: [
    body('title').trim().notEmpty().withMessage('纪念日名称不能为空')
      .isLength({ max: 50 }).withMessage('名称最多 50 个字符'),
    body('date').notEmpty().withMessage('日期不能为空'),
    body('type').optional().isIn(['solar', 'lunar']).withMessage('类型只能是 solar 或 lunar'),
    validate
  ]
};

// ===== 菜谱 =====
const recipeValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('菜名不能为空')
      .isLength({ max: 50 }).withMessage('菜名最多 50 个字符'),
    body('ingredients').optional().trim().isLength({ max: 1000 }).withMessage('食材最多 1000 字符'),
    body('steps').optional().trim().isLength({ max: 5000 }).withMessage('步骤最多 5000 字符'),
    validate
  ]
};

// ===== ID 参数校验 =====
const idParam = [
  param('id').isInt({ min: 1 }).withMessage('ID 参数不合法'),
  validate
];

module.exports = {
  validate,
  authValidators,
  accountingValidators,
  albumValidators,
  inventoryValidators,
  todoValidators,
  anniversaryValidators,
  recipeValidators,
  idParam
};
