const express = require('express');
const { readSheet, appendRows, newId } = require('../storage/excelStorage');
const { requireAuth } = require('../middleware/auth');
const { BONUS_ROLES } = require('../config/referenceData');

const router = express.Router();

// ثبت رکورد روزانه پاداش/جریمه برای یک نقش Bonus خاص
router.post('/', requireAuth, async (req, res) => {
  try {
    const { Bonus_Role, Employee_Name, Date: dateStr, Items } = req.body;
    const roleConfig = BONUS_ROLES[Bonus_Role];
    if (!roleConfig) return res.status(400).json({ error: 'نقش پاداش نامعتبر است' });
    if (!Employee_Name || !dateStr || !Items) return res.status(400).json({ error: 'اطلاعات ناقص است' });

    let deduction = 0;
    for (const item of roleConfig.items) {
      const count = Number(Items[item.key]) || 0;
      deduction += count * item.unitPenalty;
    }
    const finalAmount = Math.max(0, roleConfig.baseAmount - deduction);

    const row = {
      Bonus_ID: newId('bonus'),
      Bonus_Role, Employee_Name, Date: dateStr,
      Items_JSON: JSON.stringify(Items),
      Base_Amount: roleConfig.baseAmount,
      Final_Amount: finalAmount,
      Recorded_By: req.user.fullName,
      Created_At: new Date().toISOString(),
    };
    await appendRows('Bonus_Records', row);
    res.json({ success: true, row, finalAmount });
  } catch (e) {
    res.status(400).json({ error: e.message || 'خطا در ثبت پاداش' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  let all = await readSheet('Bonus_Records');
  const { role, employeeName, from, to } = req.query;
  if (role) all = all.filter((r) => r.Bonus_Role === role);
  if (employeeName) all = all.filter((r) => r.Employee_Name === employeeName);
  if (from) all = all.filter((r) => r.Date >= from);
  if (to) all = all.filter((r) => r.Date <= to);
  all.sort((a, b) => (a.Date < b.Date ? 1 : -1));
  res.json(all);
});

module.exports = router;
