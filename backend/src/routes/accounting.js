const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountingController');
const { authenticate } = require('../middleware/auth');
const { verifyFamilyAccess } = require('../middleware/familyAccess');
const { createUploader } = require('../middleware/upload');
const { accountingValidators, idParam } = require('../middleware/validators');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const oss = require('../utils/oss');

router.use(authenticate);

// 账本
router.post('/books', verifyFamilyAccess, accountingValidators.createBook, ctrl.createBook);
router.get('/books', verifyFamilyAccess, ctrl.getBooks);
router.put('/books/:id', idParam, ctrl.updateBook);
router.delete('/books/:id', idParam, ctrl.deleteBook);

// 交易
router.post('/transactions', accountingValidators.createTransaction, ctrl.createTransaction);
router.get('/transactions', ctrl.getTransactions);
router.put('/transactions/:id', idParam, ctrl.updateTransaction);
router.delete('/transactions/:id', idParam, ctrl.deleteTransaction);
router.post('/transactions/import', ctrl.importTransactions);

// 分类
router.get('/categories', verifyFamilyAccess, ctrl.getCategories);
router.post('/categories', verifyFamilyAccess, accountingValidators.createCategory, ctrl.createCategory);
router.put('/categories/:id', idParam, ctrl.updateCategory);
router.delete('/categories/:id', idParam, ctrl.deleteCategory);

// 预算
router.post('/budgets', accountingValidators.setBudget, ctrl.setBudget);
router.get('/budgets', ctrl.getBudgets);
router.delete('/budgets/:id', idParam, ctrl.deleteBudget);

// 定时记账
router.post('/recurring', accountingValidators.createRecurringBill, ctrl.createRecurringBill);
router.get('/recurring', ctrl.getRecurringBills);
router.put('/recurring/:id', idParam, ctrl.updateRecurringBill);
router.delete('/recurring/:id', idParam, ctrl.deleteRecurringBill);
router.put('/recurring/:id/toggle', idParam, ctrl.toggleRecurringBill);
router.post('/recurring/:id/trigger', idParam, ctrl.triggerRecurringBill);

// 报表
router.get('/report/daily', ctrl.getDailyReport);
router.get('/report/monthly', ctrl.getMonthlyReport);
router.get('/report/yearly', ctrl.getYearlyReport);
router.get('/report/yearly-category', ctrl.getYearlyCategoryReport);
router.get('/report/yearly-category-matrix', ctrl.getYearlyCategoryMatrix);
router.get('/report/export', ctrl.exportReport);

// 语音/图片上传
const upload = createUploader('receipts');
router.post('/upload-receipt', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });

    const config = await oss.getOSSConfig();

    if (config.oss_enabled === 'true') {
      const ext = path.extname(req.file.originalname);
      const filename = `${uuidv4()}${ext}`;
      const buffer = fs.readFileSync(req.file.path);
      const result = await oss.uploadBuffer(buffer, filename, { dir: 'receipts' });
      fs.unlink(req.file.path, () => {});
      return res.json({ code: 0, data: { url: result.url } });
    }

    res.json({ code: 0, data: { url: `/uploads/receipts/${req.file.filename}` } });
  } catch (err) { next(err); }
});

module.exports = router;
