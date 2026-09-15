const express = require('express');
const { readSheet, appendRows, updateRowByKey, newId } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// دریافت Period فعال فعلی (برای همه کاربران قابل مشاهده)
router.get('/active', requireAuth, async (req, res) => {
  const periods = await readSheet('Periods');
  const active = periods.find((p) => String(p.Is_Active) === 'true');
  res.json(active || null);
});

// دریافت تاریخچه کامل Periodها (فقط ادمین)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const periods = await readSheet('Periods');
  res.json(periods.sort((a, b) => (a.Created_At < b.Created_At ? 1 : -1)));
});

// تعیین Period جدید فعال (فقط ادمین) — Periodهای قبلی حذف نمی‌شوند، فقط Is_Active=false می‌شوند
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { Year, Month, Week } = req.body;
  if (!Year || !Month || !Week) {
    return res.status(400).json({ error: 'سال، ماه و هفته الزامی است' });
  }
  const periods = await readSheet('Periods');
  // غیرفعال کردن Periodهای قبلی
  for (const p of periods) {
    if (String(p.Is_Active) === 'true') {
      await updateRowByKey('Periods', 'Period_ID', p.Period_ID, { Is_Active: 'false' });
    }
  }
  // اگر این ترکیب سال/ماه/هفته قبلا وجود داشت، فقط آن را فعال کن
  const existing = periods.find((p) => String(p.Year) === String(Year) && p.Month === Month && String(p.Week) === String(Week));
  if (existing) {
    await updateRowByKey('Periods', 'Period_ID', existing.Period_ID, { Is_Active: 'true' });
    return res.json({ ...existing, Is_Active: 'true' });
  }
  const newPeriod = {
    Period_ID: newId('period'),
    Year, Month, Week,
    Is_Active: 'true',
    Created_At: new Date().toISOString(),
  };
  await appendRows('Periods', newPeriod);
  res.json(newPeriod);
});

module.exports = router;
