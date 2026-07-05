const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountingController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');

router.use(authenticate);

// 账本
router.post('/books', verifyFamilyAccess, ctrl.createBook);
router.get('/books', verifyFamilyAccess, ctrl.getBooks);
router.put('/books/:id', ctrl.updateBook);
router.delete('/books/:id', ctrl.deleteBook);

// 交易
router.post('/transactions', ctrl.createTransaction);
router.get('/transactions', ctrl.getTransactions);
router.put('/transactions/:id', ctrl.updateTransaction);
router.delete('/transactions/:id', ctrl.deleteTransaction);

// 分类
router.get('/categories', verifyFamilyAccess, ctrl.getCategories);
router.post('/categories', verifyFamilyAccess, ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// 预算
router.post('/budgets', ctrl.setBudget);
router.get('/budgets', ctrl.getBudgets);
router.delete('/budgets/:id', ctrl.deleteBudget);

// 定时记账
router.post('/recurring', ctrl.createRecurringBill);
router.get('/recurring', ctrl.getRecurringBills);
router.put('/recurring/:id', ctrl.updateRecurringBill);
router.delete('/recurring/:id', ctrl.deleteRecurringBill);
router.put('/recurring/:id/toggle', ctrl.toggleRecurringBill);
router.post('/recurring/:id/trigger', ctrl.triggerRecurringBill);

// 报表
router.get('/report/daily', ctrl.getDailyReport);
router.get('/report/monthly', ctrl.getMonthlyReport);
router.get('/report/yearly', ctrl.getYearlyReport);
router.get('/report/yearly-category', ctrl.getYearlyCategoryReport);
router.get('/report/yearly-category-matrix', ctrl.getYearlyCategoryMatrix);
router.get('/report/export', ctrl.exportReport);

// 语音/图片上传
const upload = createUploader('receipts');
router.post('/upload-receipt', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });
  res.json({ code: 0, data: { url: `/uploads/receipts/${req.file.filename}` } });
});

module.exports = router;
