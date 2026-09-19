const express = require('express');
const ExcelJS = require('exceljs');
const { readSheet, appendRows, newId } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { BONUS_UNIT_AMOUNT, BONUS_TYPES } = require('../config/referenceData');
const { DEPARTMENTS } = require('../config/formsConfig');
const { getCurrentPeriodInfo } = require('../utils/persianDate');

const router = express.Router();

// ثبت رکورد پاداش/جریمه — هر امتیاز معادل مبلغ ثابت BONUS_UNIT_AMOUNT (تومان) است
router.post('/', requireAuth, async (req, res) => {
  try {
    const { Department, Employee_ID, Employee_Name, Type, Score, Notes } = req.body;
    if (!Department || !Employee_ID || !Employee_Name || !Type || Score === undefined) {
      return res.status(400).json({ error: 'اطلاعات ارسالی ناقص است' });
    }
    if (!BONUS_TYPES[Type]) {
      return res.status(400).json({ error: 'نوع رکورد باید پاداش یا جریمه باشد' });
    }
    const score = Number(Score);
    if (Number.isNaN(score) || score <= 0) {
      return res.status(400).json({ error: 'امتیاز باید عددی مثبت باشد' });
    }

    // Permission: ادمین به همه بخش‌ها دسترسی دارد؛ Evaluator فقط به بخش‌های تخصیص‌یافته توسط ادمین
    if (req.user.role !== 'ADMIN' && !(req.user.bonusDepartments || []).includes(Department)) {
      return res.status(403).json({ error: 'شما به ثبت پاداش/جریمه برای این بخش دسترسی ندارید' });
    }

    const current = getCurrentPeriodInfo();
    const amount = score * BONUS_UNIT_AMOUNT;

    const row = {
      Bonus_ID: newId('bonus'),
      Date: current.DateLabel,
      Department, Employee_ID, Employee_Name,
      Evaluator_ID: req.user.id, Evaluator_Name: req.user.fullName,
      Type, Score: score, Amount: amount,
      Notes: Notes || '',
      Created_At: new Date().toISOString(),
    };
    await appendRows('Bonus_Records', row);
    res.json({ success: true, row });
  } catch (e) {
    res.status(400).json({ error: e.message || 'خطا در ثبت رکورد' });
  }
});

// فهرست رکوردها — ادمین همه را می‌بیند؛ Evaluator فقط رکوردهای خودش را
router.get('/', requireAuth, async (req, res) => {
  let all = await readSheet('Bonus_Records');
  if (req.user.role !== 'ADMIN') {
    all = all.filter((r) => r.Evaluator_ID === req.user.id);
  }
  const { department, type, employeeName } = req.query;
  if (department) all = all.filter((r) => r.Department === department);
  if (type) all = all.filter((r) => r.Type === type);
  if (employeeName) all = all.filter((r) => r.Employee_Name === employeeName);
  all.sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1));
  res.json(all);
});

function deptLabel(id) { return DEPARTMENTS[id]?.label || id; }
function typeLabel(id) { return BONUS_TYPES[id]?.label || id; }

// خروجی Excel (فقط ادمین) — تاریخ، پرسنل، ارزیاب، نوع، امتیاز، مبلغ، توضیحات
router.get('/export', requireAuth, requireAdmin, async (req, res) => {
  let all = await readSheet('Bonus_Records');
  const { department, type } = req.query;
  if (department) all = all.filter((r) => r.Department === department);
  if (type) all = all.filter((r) => r.Type === type);
  all.sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('پاداش و جریمه');
  ws.views = [{ rightToLeft: true }];
  ws.addRow(['تاریخ', 'نام پرسنل', 'بخش', 'نام ارزیاب', 'نوع', 'امتیاز', 'مبلغ (تومان)', 'توضیحات']);
  ws.getRow(1).font = { bold: true };
  all.forEach((r) => {
    ws.addRow([r.Date, r.Employee_Name, deptLabel(r.Department), r.Evaluator_Name, typeLabel(r.Type), r.Score, r.Amount, r.Notes]);
  });
  ws.columns.forEach((col) => { col.width = 18; });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ferno_bonus_export.xlsx');
  await wb.xlsx.write(res);
  res.end();
});

module.exports = router;
