const express = require('express');
const { readSheet } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getCurrentPeriodInfo, PERSIAN_MONTHS } = require('../utils/persianDate');

const router = express.Router();

/**
 * دوره (سال/ماه/هفته شمسی) دیگر توسط ادمین دستی وارد نمی‌شود؛ به‌صورت خودکار
 * از تاریخ واقعی (به وقت تهران) محاسبه می‌شود. همچنین مشخص می‌شود امروز
 * «روز مجاز ارزیابی» (پنجشنبه/جمعه) هست یا نه. ادمین از این محدودیت روزی
 * مستثناست و همیشه دسترسی کامل دارد (این استثنا در routes/evaluations.js
 * اعمال می‌شود، نه اینجا).
 */
router.get('/active', requireAuth, async (req, res) => {
  res.json(getCurrentPeriodInfo());
});

// تاریخچه دوره‌هایی که واقعاً برایشان ارزیابی ثبت شده (برای فیلتر/گزارش ادمین)
// این فهرست از روی داده واقعی Evaluations ساخته می‌شود، نه از یک Sheet دستی.
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const evaluations = await readSheet('Evaluations');
  const current = getCurrentPeriodInfo();

  const groups = new Map();
  for (const ev of evaluations) {
    const key = `${ev.Year}|${ev.Month}|${ev.Week}`;
    if (!groups.has(key)) {
      groups.set(key, { Year: ev.Year, Month: ev.Month, Week: ev.Week, EvaluationCount: 0 });
    }
    groups.get(key).EvaluationCount += 1;
  }

  const list = Array.from(groups.values()).map((p) => ({
    ...p,
    Is_Current: String(p.Year) === String(current.Year) && p.Month === current.Month && String(p.Week) === String(current.Week),
  }));

  list.sort((a, b) => {
    if (a.Year !== b.Year) return b.Year - a.Year;
    const mi = PERSIAN_MONTHS.indexOf(a.Month) - PERSIAN_MONTHS.indexOf(b.Month);
    if (mi !== 0) return -mi;
    return b.Week - a.Week;
  });

  res.json({ current, history: list });
});

module.exports = router;
