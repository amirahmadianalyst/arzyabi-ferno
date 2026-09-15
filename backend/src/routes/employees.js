const express = require('express');
const { readSheet, appendRows, updateRowByKey, newId } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// دریافت پرسنل — Evaluatorها فقط پرسنل بخش‌های مجاز خودشان را می‌بینند
router.get('/', requireAuth, async (req, res) => {
  const dept = req.query.department;
  let employees = await readSheet('Employees');
  employees = employees.filter((e) => String(e.Active) !== 'false');
  if (dept) {
    if (req.user.role !== 'ADMIN' && !req.user.departments.includes(dept)) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز به این بخش' });
    }
    employees = employees.filter((e) => e.Department === dept);
  } else if (req.user.role !== 'ADMIN') {
    employees = employees.filter((e) => req.user.departments.includes(e.Department));
  }
  res.json(employees);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { Employee_Name, Department } = req.body;
  if (!Employee_Name || !Department) return res.status(400).json({ error: 'نام و بخش الزامی است' });
  const emp = {
    Employee_ID: newId('emp'),
    Employee_Name, Department,
    Active: 'true',
    Created_At: new Date().toISOString(),
  };
  await appendRows('Employees', emp);
  res.json(emp);
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const ok = await updateRowByKey('Employees', 'Employee_ID', req.params.id, req.body);
  if (!ok) return res.status(404).json({ error: 'پرسنل یافت نشد' });
  res.json({ success: true });
});

module.exports = router;
