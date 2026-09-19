const express = require('express');
const { readSheet } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { DEPARTMENTS, FORMS } = require('../config/formsConfig');
const { getCurrentPeriodInfo } = require('../utils/persianDate');

const router = express.Router();

router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  const [employees, users, evaluations] = await Promise.all([
    readSheet('Employees'), readSheet('Users'), readSheet('Evaluations'),
  ]);
  const activePeriod = getCurrentPeriodInfo();
  const activeEmployees = employees.filter((e) => String(e.Active) !== 'false');
  const evaluators = users.filter((u) => u.Role === 'EVALUATOR');

  const periodEvals = evaluations.filter((e) =>
    String(e.Year) === String(activePeriod.Year) && e.Month === activePeriod.Month && String(e.Week) === String(activePeriod.Week)
  );

  const deptStats = Object.values(DEPARTMENTS).map((d) => {
    const deptEmployees = activeEmployees.filter((e) => e.Department === d.id);
    const deptEvals = periodEvals.filter((e) => e.Department === d.id);
    const avg = deptEvals.length
      ? deptEvals.reduce((s, e) => s + Number(e.Average_Score || 0), 0) / deptEvals.length
      : 0;
    return {
      department: d.id, label: d.label,
      employeeCount: deptEmployees.length,
      evaluationCount: deptEvals.length,
      averageScore: Math.round(avg * 100) / 100,
    };
  });

  const overallAvg = periodEvals.length
    ? periodEvals.reduce((s, e) => s + Number(e.Average_Score || 0), 0) / periodEvals.length
    : 0;

  res.json({
    activePeriod,
    totalEmployees: activeEmployees.length,
    totalEvaluators: evaluators.length,
    totalEvaluations: evaluations.length,
    periodEvaluations: periodEvals.length,
    averageScore: Math.round(overallAvg * 100) / 100,
    departmentStats: deptStats,
  });
});

router.get('/evaluator', requireAuth, async (req, res) => {
  const [evaluations, employees] = await Promise.all([
    readSheet('Evaluations'), readSheet('Employees'),
  ]);
  const activePeriod = getCurrentPeriodInfo();
  const myEvals = evaluations.filter((e) => e.Evaluator_ID === req.user.id);

  const periodMyEvals = myEvals.filter((e) =>
    String(e.Year) === String(activePeriod.Year) && e.Month === activePeriod.Month && String(e.Week) === String(activePeriod.Week)
  );
  const myDeptEmployees = employees.filter((e) =>
    String(e.Active) !== 'false' && req.user.departments.includes(e.Department)
  );
  // انتظار: هر پرسنل در هر بخش مجاز، یک ارزیابی به ازای هر فرم مجاز کاربر
  const expectedCount = myDeptEmployees.length * req.user.forms.length;

  const completionRate = expectedCount > 0 ? Math.round((periodMyEvals.length / expectedCount) * 100) : 0;

  res.json({
    activePeriod,
    completed: periodMyEvals.length,
    remaining: Math.max(0, expectedCount - periodMyEvals.length),
    completionRate,
    recentEvaluations: myEvals
      .sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1))
      .slice(0, 5),
  });
});

// وضعیت تکمیل ارزیابی هر بخش برای Evaluator جاری، در دوره فعلی (برای سبز شدن دکمه بخش)
router.get('/evaluator/departments', requireAuth, async (req, res) => {
  const [evaluations, employees] = await Promise.all([
    readSheet('Evaluations'), readSheet('Employees'),
  ]);
  const activePeriod = getCurrentPeriodInfo();

  const myPeriodEvals = evaluations.filter((e) =>
    e.Evaluator_ID === req.user.id &&
    String(e.Year) === String(activePeriod.Year) &&
    e.Month === activePeriod.Month &&
    String(e.Week) === String(activePeriod.Week)
  );

  const result = (req.user.departments || []).map((deptId) => {
    const deptEmployees = employees.filter((e) => String(e.Active) !== 'false' && e.Department === deptId);
    // فقط فرم‌هایی که هم به این کاربر تعلق دارند و هم برای این بخش تعریف شده‌اند
    const applicableForms = (req.user.forms || []).filter((formId) => FORMS[formId] && FORMS[formId].departments[deptId]);
    const expected = deptEmployees.length * applicableForms.length;
    const completed = myPeriodEvals.filter((e) => e.Department === deptId && applicableForms.includes(e.Form_ID)).length;
    return {
      department: deptId,
      employeeCount: deptEmployees.length,
      expected,
      completed,
      isComplete: expected > 0 && completed >= expected,
    };
  });

  res.json(result);
});

module.exports = router;
