const express = require('express');
const { FORMS, DEPARTMENTS } = require('../config/formsConfig');
const { EVALUATOR_ROLES, BONUS_ROLES } = require('../config/referenceData');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/departments', requireAuth, (req, res) => {
  let depts = Object.values(DEPARTMENTS);
  if (req.user.role !== 'ADMIN') {
    depts = depts.filter((d) => req.user.departments.includes(d.id));
  }
  res.json(depts);
});

router.get('/forms', requireAuth, (req, res) => {
  let forms = Object.values(FORMS).map((f) => ({
    id: f.id, label: f.label, masterKey: f.masterKey,
    departments: Object.keys(f.departments),
  }));
  if (req.user.role !== 'ADMIN') {
    forms = forms.filter((f) => req.user.forms.includes(f.id));
  }
  res.json(forms);
});

// دریافت معیارهای دقیق یک فرم برای یک بخش خاص
router.get('/forms/:formId/:department', requireAuth, (req, res) => {
  const { formId, department } = req.params;
  const form = FORMS[formId];
  if (!form) return res.status(404).json({ error: 'فرم یافت نشد' });
  if (req.user.role !== 'ADMIN' && !req.user.forms.includes(formId)) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز به این فرم' });
  }
  const deptConfig = form.departments[department];
  if (!deptConfig) return res.status(404).json({ error: 'این فرم برای این بخش تعریف نشده' });
  res.json({
    formId, label: form.label, department,
    criteria: deptConfig.criteria.map((c) => ({ key: c.key, label: c.label, scale: c.scale })),
  });
});

router.get('/evaluator-roles', requireAuth, (req, res) => {
  res.json(Object.values(EVALUATOR_ROLES));
});

router.get('/bonus-roles', requireAuth, (req, res) => {
  res.json(Object.values(BONUS_ROLES));
});

module.exports = router;
