const express = require('express');
const ExcelJS = require('exceljs');
const { readSheet } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { DEPARTMENTS, FORMS } = require('../config/formsConfig');

const router = express.Router();

const PERSIAN_HEADERS = {
  Evaluation_ID: 'شناسه ارزیابی',
  Employee_ID: 'شناسه پرسنل',
  Employee_Name: 'نام پرسنل',
  Department: 'بخش',
  Evaluator_ID: 'شناسه ارزیاب',
  Evaluator_Name: 'نام ارزیاب',
  Form_ID: 'فرم ارزیابی',
  Year: 'سال',
  Month: 'ماه',
  Week: 'هفته',
  Average_Score: 'میانگین امتیاز',
  Notes: 'توضیحات',
  Status: 'وضعیت',
  Created_At: 'تاریخ ثبت',
  Updated_At: 'تاریخ به‌روزرسانی',
};

function translateDept(id) { return DEPARTMENTS[id]?.label || id; }
function translateForm(id) { return FORMS[id]?.label || id; }

async function filterEvaluations(query) {
  let all = await readSheet('Evaluations');
  all = all.filter((e) => e.Status !== 'DELETED');
  const { year, month, week, department, evaluatorId, employeeId, formId } = query;
  if (year) all = all.filter((e) => String(e.Year) === String(year));
  if (month) all = all.filter((e) => e.Month === month);
  if (week) all = all.filter((e) => String(e.Week) === String(week));
  if (department) all = all.filter((e) => e.Department === department);
  if (evaluatorId) all = all.filter((e) => e.Evaluator_ID === evaluatorId);
  if (employeeId) all = all.filter((e) => e.Employee_ID === employeeId);
  if (formId) all = all.filter((e) => e.Form_ID === formId);
  return all;
}

// خروجی خام - نام‌های فنی اصلی
router.get('/raw', requireAuth, requireAdmin, async (req, res) => {
  const rows = await filterEvaluations(req.query);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Evaluations');
  const columns = Object.keys(rows[0] || { Evaluation_ID: '' });
  ws.addRow(columns);
  ws.getRow(1).font = { bold: true };
  rows.forEach((r) => ws.addRow(columns.map((c) => r[c])));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ferno_export_raw.xlsx');
  await wb.xlsx.write(res);
  res.end();
});

// خروجی مدیریتی - Headerهای فارسی و مقادیر ترجمه‌شده
router.get('/management', requireAuth, requireAdmin, async (req, res) => {
  const rows = await filterEvaluations(req.query);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('ارزیابی‌ها');
  ws.views = [{ rightToLeft: true }];
  const columns = ['Employee_Name', 'Department', 'Evaluator_Name', 'Form_ID', 'Year', 'Month', 'Week', 'Average_Score', 'Notes', 'Status', 'Created_At'];
  ws.addRow(columns.map((c) => PERSIAN_HEADERS[c] || c));
  ws.getRow(1).font = { bold: true };
  rows.forEach((r) => {
    ws.addRow([
      r.Employee_Name, translateDept(r.Department), r.Evaluator_Name, translateForm(r.Form_ID),
      r.Year, r.Month, r.Week, r.Average_Score, r.Notes, r.Status === 'SUBMITTED' ? 'ثبت‌شده' : r.Status, r.Created_At,
    ]);
  });
  ws.columns.forEach((col) => { col.width = 18; });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ferno_export_management.xlsx');
  await wb.xlsx.write(res);
  res.end();
});

router.get('/csv', requireAuth, requireAdmin, async (req, res) => {
  const rows = await filterEvaluations(req.query);
  const columns = ['Employee_Name', 'Department', 'Evaluator_Name', 'Form_ID', 'Year', 'Month', 'Week', 'Average_Score', 'Notes', 'Status', 'Created_At'];
  const header = columns.map((c) => PERSIAN_HEADERS[c] || c).join(',');
  const lines = rows.map((r) => [
    r.Employee_Name, translateDept(r.Department), r.Evaluator_Name, translateForm(r.Form_ID),
    r.Year, r.Month, r.Week, r.Average_Score, `"${(r.Notes || '').replace(/"/g, '""')}"`, r.Status, r.Created_At,
  ].join(','));
  const csv = '\uFEFF' + [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=ferno_export.csv');
  res.send(csv);
});

module.exports = router;
