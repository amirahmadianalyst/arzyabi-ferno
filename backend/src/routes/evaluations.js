const express = require('express');
const { readSheet, appendRows, updateRowByKey, newId } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { FORMS, MASTER_WEIGHTS } = require('../config/formsConfig');
const { computeFormScore, computeMasterScore } = require('../utils/scoring');
const { getCurrentPeriodInfo } = require('../utils/persianDate');

const router = express.Router();

function matchesPeriodEmployee(ev, { employeeId, evaluatorId, formId, year, month, week }) {
  return (
    ev.Employee_ID === employeeId &&
    ev.Form_ID === formId &&
    String(ev.Year) === String(year) &&
    ev.Month === month &&
    String(ev.Week) === String(week) &&
    (evaluatorId ? ev.Evaluator_ID === evaluatorId : true)
  );
}

// بررسی وجود ارزیابی تکراری
router.get('/check-duplicate', requireAuth, async (req, res) => {
  const { employeeId, formId, year, month, week } = req.query;
  const all = await readSheet('Evaluations');
  const found = all.find((ev) =>
    ev.Employee_ID === employeeId && ev.Form_ID === formId &&
    String(ev.Year) === String(year) && ev.Month === month && String(ev.Week) === String(week) &&
    ev.Status !== 'DELETED'
  );
  res.json({ duplicate: !!found, evaluation: found || null });
});

// ثبت ارزیابی جدید
router.post('/', requireAuth, async (req, res) => {
  try {
    const { Employee_ID, Employee_Name, Department, Form_ID, Notes, Scores } = req.body;
    if (!Employee_ID || !Department || !Form_ID || !Scores) {
      return res.status(400).json({ error: 'اطلاعات ارسالی ناقص است' });
    }

    // محاسبه خودکار دوره (سال/ماه/هفته) و بررسی روز مجاز ارزیابی.
    // ادمین از این محدودیت مستثناست و همیشه دسترسی کامل دارد.
    const current = getCurrentPeriodInfo();
    let Year = current.Year, Month = current.Month, Week = current.Week;

    if (req.user.role !== 'ADMIN') {
      if (!current.IsEvaluationDay) {
        return res.status(403).json({
          error: `روزهای مجاز ثبت ارزیابی ${current.AllowedDaysLabel} است. امروز ${current.WeekdayFa} است.`,
        });
      }
      // برای Evaluator، سال/ماه/هفته همیشه از سرور محاسبه می‌شود (قابل دستکاری از سمت کلاینت نیست)
    } else if (req.body.Year && req.body.Month && req.body.Week) {
      // ادمین در صورت نیاز می‌تواند دوره را صریحاً مشخص کند (مثلاً برای ثبت دستی/اصلاحی)
      Year = req.body.Year; Month = req.body.Month; Week = req.body.Week;
    }

    // بررسی Permission
    if (req.user.role !== 'ADMIN') {
      if (!req.user.departments.includes(Department)) {
        return res.status(403).json({ error: 'شما به این بخش دسترسی ندارید' });
      }
      if (!req.user.forms.includes(Form_ID)) {
        return res.status(403).json({ error: 'شما به این فرم دسترسی ندارید' });
      }
    }
    const form = FORMS[Form_ID];
    if (!form || !form.departments[Department]) {
      return res.status(400).json({ error: 'ترکیب فرم/بخش نامعتبر است' });
    }

    // جلوگیری از ثبت تکراری
    const all = await readSheet('Evaluations');
    const dup = all.find((ev) =>
      ev.Employee_ID === Employee_ID && ev.Form_ID === Form_ID &&
      String(ev.Year) === String(Year) && ev.Month === Month && String(ev.Week) === String(Week) &&
      ev.Status !== 'DELETED'
    );
    if (dup) {
      return res.status(409).json({ error: 'برای این پرسنل در این دوره قبلاً ارزیابی ثبت شده است.', evaluationId: dup.Evaluation_ID });
    }

    const avgScore = computeFormScore(Form_ID, Department, Scores);

    const evalId = newId('eval');
    const now = new Date().toISOString();
    const evaluationRow = {
      Evaluation_ID: evalId,
      Employee_ID, Employee_Name, Department,
      Evaluator_ID: req.user.id, Evaluator_Name: req.user.fullName,
      Form_ID, Year, Month, Week,
      Average_Score: avgScore,
      Notes: Notes || '',
      Status: 'SUBMITTED',
      Created_At: now, Updated_At: now,
    };
    await appendRows('Evaluations', evaluationRow);

    const deptConfig = form.departments[Department];
    const scoreRows = deptConfig.criteria.map((c) => ({
      Evaluation_ID: evalId,
      Criterion_ID: c.key,
      Criterion_Name: c.label,
      Score: Scores[c.key],
      Comment: '',
    }));
    await appendRows('Evaluation_Scores', scoreRows);

    res.json({ success: true, evaluation: evaluationRow });
  } catch (e) {
    res.status(400).json({ error: e.message || 'خطا در ثبت ارزیابی' });
  }
});

// ویرایش ارزیابی موجود
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const all = await readSheet('Evaluations');
    const ev = all.find((e) => e.Evaluation_ID === req.params.id);
    if (!ev) return res.status(404).json({ error: 'ارزیابی یافت نشد' });

    const isOwner = ev.Evaluator_ID === req.user.id;
    if (req.user.role !== 'ADMIN' && !isOwner) {
      return res.status(403).json({ error: 'شما اجازه ویرایش این ارزیابی را ندارید' });
    }

    const { Scores, Notes } = req.body;
    let updates = { Updated_At: new Date().toISOString() };
    if (Notes !== undefined) updates.Notes = Notes;

    if (Scores) {
      const avgScore = computeFormScore(ev.Form_ID, ev.Department, Scores);
      updates.Average_Score = avgScore;
      // توجه: چون کلید ردیف‌های Evaluation_Scores مرکب است (Evaluation_ID + Criterion_ID) و
      // قانون سامانه Overwrite/Delete را ممنوع می‌کند، نسخه ویرایش‌شده امتیازها به‌صورت
      // رکوردهای جدید (با Criterion_ID متمایز) Append می‌شود تا تاریخچه کامل نمرات حفظ شود.
      const form = FORMS[ev.Form_ID];
      const deptConfig = form.departments[ev.Department];
      const newScoreRows = deptConfig.criteria.map((c) => ({
        Evaluation_ID: ev.Evaluation_ID,
        Criterion_ID: c.key + '_edited_' + Date.now(),
        Criterion_Name: c.label,
        Score: Scores[c.key],
        Comment: '(نسخه ویرایش‌شده)',
      }));
      await appendRows('Evaluation_Scores', newScoreRows);
    }

    await updateRowByKey('Evaluations', 'Evaluation_ID', ev.Evaluation_ID, updates);
    await appendRows('Audit_Log', {
      Log_ID: newId('log'),
      User_ID: req.user.id, Username: req.user.username,
      Action: 'EDIT_EVALUATION',
      Details: `ویرایش ارزیابی ${ev.Evaluation_ID}`,
      Created_At: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message || 'خطا در ویرایش' });
  }
});

// لیست ارزیابی‌ها با فیلتر (ادمین: همه؛ Evaluator: فقط مال خودش مگر ادمین باشد)
router.get('/', requireAuth, async (req, res) => {
  let all = await readSheet('Evaluations');
  all = all.filter((ev) => ev.Status !== 'DELETED');

  if (req.user.role !== 'ADMIN') {
    all = all.filter((ev) => ev.Evaluator_ID === req.user.id);
  }

  const { year, month, week, department, evaluatorId, employeeId, formId } = req.query;
  if (year) all = all.filter((e) => String(e.Year) === String(year));
  if (month) all = all.filter((e) => e.Month === month);
  if (week) all = all.filter((e) => String(e.Week) === String(week));
  if (department) all = all.filter((e) => e.Department === department);
  if (evaluatorId) all = all.filter((e) => e.Evaluator_ID === evaluatorId);
  if (employeeId) all = all.filter((e) => e.Employee_ID === employeeId);
  if (formId) all = all.filter((e) => e.Form_ID === formId);

  all.sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1));
  res.json(all);
});

// محاسبه امتیاز نهایی (Master) یک پرسنل در یک دوره خاص، بر اساس ترکیب فرم‌های ثبت‌شده
router.get('/master-score', requireAuth, async (req, res) => {
  const { employeeId, department, year, month, week } = req.query;
  if (!employeeId || !department || !year || !month || !week) {
    return res.status(400).json({ error: 'پارامترهای لازم ناقص است' });
  }
  const all = await readSheet('Evaluations');
  const manual = await readSheet('Manual_Scores');

  const relevant = all.filter((e) =>
    e.Employee_ID === employeeId && e.Department === department &&
    String(e.Year) === String(year) && e.Month === month && String(e.Week) === String(week) &&
    e.Status !== 'DELETED'
  );

  const formScores = {};
  for (const ev of relevant) {
    const form = FORMS[ev.Form_ID];
    if (form) formScores[form.masterKey] = Number(ev.Average_Score);
  }
  const manualEntry = manual.find((m) =>
    m.Employee_ID === employeeId && m.Department === department && m.Metric === 'system' &&
    String(m.Year) === String(year) && m.Month === month && String(m.Week) === String(week)
  );
  if (manualEntry) formScores['system'] = Number(manualEntry.Score);

  const masterScore = computeMasterScore(department, formScores, MASTER_WEIGHTS);
  res.json({ formScores, masterScore, componentsUsed: Object.keys(formScores) });
});

// ثبت نمره دستی "سیستم" توسط ادمین (ستونی که در هیچ فرمی تولید نمی‌شود - طبق README/ASSUMPTIONS)
router.post('/manual-score', requireAuth, requireAdmin, async (req, res) => {
  const { Employee_ID, Employee_Name, Department, Metric, Year, Month, Week, Score } = req.body;
  if (!Employee_ID || !Department || !Metric || !Year || !Month || !Week || Score === undefined) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }
  const row = {
    Manual_Score_ID: newId('manual'),
    Employee_ID, Employee_Name, Department, Metric, Year, Month, Week, Score,
    Set_By: req.user.fullName,
    Created_At: new Date().toISOString(),
  };
  await appendRows('Manual_Scores', row);
  res.json({ success: true, row });
});

module.exports = router;
