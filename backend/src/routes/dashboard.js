const express = require('express');
const { readSheet } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { DEPARTMENTS } = require('../config/formsConfig');

const router = express.Router();

router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  const [employees, users, evaluations, periods] = await Promise.all([
    readSheet('Employees'), readSheet('Users'), readSheet('Evaluations'), readSheet('Periods'),
  ]);
  const activePeriod = periods.find((p) => String(p.Is_Active) === 'true');
  const activeEmployees = employees.filter((e) => String(e.Active) !== 'false');
  const evaluators = users.filter((u) => u.Role === 'EVALUATOR');

  let periodEvals = evaluations;
  if (activePeriod) {
    periodEvals = evaluations.filter((e) =>
      String(e.Year) === String(activePeriod.Year) && e.Month === activePeriod.Month && String(e.Week) === String(activePeriod.Week)
    );
  }

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
    activePeriod: activePeriod || null,
    totalEmployees: activeEmployees.length,
    totalEvaluators: evaluators.length,
    totalEvaluations: evaluations.length,
    periodEvaluations: periodEvals.length,
    averageScore: Math.round(overallAvg * 100) / 100,
    departmentStats: deptStats,
  });
});

router.get('/evaluator', requireAuth, async (req, res) => {
  const [evaluations, periods, employees] = await Promise.all([
    readSheet('Evaluations'), readSheet('Periods'), readSheet('Employees'),
  ]);
  const activePeriod = periods.find((p) => String(p.Is_Active) === 'true');
  const myEvals = evaluations.filter((e) => e.Evaluator_ID === req.user.id);

  let periodMyEvals = myEvals;
  let expectedCount = 0;
  if (activePeriod) {
    periodMyEvals = myEvals.filter((e) =>
      String(e.Year) === String(activePeriod.Year) && e.Month === activePeriod.Month && String(e.Week) === String(activePeriod.Week)
    );
    const myDeptEmployees = employees.filter((e) =>
      String(e.Active) !== 'false' && req.user.departments.includes(e.Department)
    );
    // انتظار: هر پرسنل در هر بخش مجاز، یک ارزیابی به ازای هر فرم مجاز کاربر
    expectedCount = myDeptEmployees.length * req.user.forms.length;
  }

  const completionRate = expectedCount > 0 ? Math.round((periodMyEvals.length / expectedCount) * 100) : 0;

  res.json({
    activePeriod: activePeriod || null,
    completed: periodMyEvals.length,
    remaining: Math.max(0, expectedCount - periodMyEvals.length),
    completionRate,
    recentEvaluations: myEvals
      .sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1))
      .slice(0, 5),
  });
});

module.exports = router;
