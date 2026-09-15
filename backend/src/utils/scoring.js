const { FORMS } = require('../config/formsConfig');

/**
 * محاسبه امتیاز یک فرم برای یک بخش خاص، دقیقاً طبق فرمول استخراج‌شده از Excel.
 * scoresByCriterionKey: { Criterion_Key: numericScore }
 */
function computeFormScore(formId, departmentId, scoresByCriterionKey) {
  const form = FORMS[formId];
  if (!form) throw new Error('فرم ناشناخته');
  const deptConfig = form.departments[departmentId];
  if (!deptConfig) throw new Error('این فرم برای این بخش تعریف نشده است');

  let sum = 0;
  for (const c of deptConfig.criteria) {
    const val = Number(scoresByCriterionKey[c.key]);
    if (Number.isNaN(val)) throw new Error(`نمره معیار «${c.label}» وارد نشده است`);
    if (val < 1 || val > 5) throw new Error(`نمره معیار «${c.label}» باید بین 1 تا 5 باشد`);
    sum += val * c.weight;
  }
  const score = sum / deptConfig.divisor;
  return Math.round(score * 100) / 100;
}

/**
 * محاسبه امتیاز نهایی (فایل «ارزیابی کل پرسنل») برای یک پرسنل/دوره خاص
 * بر اساس میانگین وزن‌دار امتیازهای فرم‌های موجود.
 * formScores: { responsible: 4.2, camera: 3.8, hr: 5, ... } - فقط فرم‌های موجود را شامل شود
 */
function computeMasterScore(departmentId, formScores, masterWeightsConfig) {
  const cfg = masterWeightsConfig[departmentId];
  if (!cfg) throw new Error('بخش ناشناخته برای محاسبه امتیاز نهایی');
  let sum = 0;
  let usedDivisorPortion = 0;
  let anyFound = false;
  for (const [key, weight] of Object.entries(cfg.weights)) {
    if (formScores[key] !== undefined && formScores[key] !== null) {
      sum += Number(formScores[key]) * weight;
      usedDivisorPortion += weight;
      anyFound = true;
    }
  }
  if (!anyFound) return null;
  // از تقسیم بر divisor کامل استفاده می‌کنیم تا با منطق اصلی اکسل یکسان بماند؛
  // اگر مؤلفه‌ای موجود نبود، بر اساس مجموع وزن‌های موجود نرمال می‌شود (میانگین وزنی واقعی).
  const divisor = cfg.divisor;
  const fullWeightSum = Object.values(cfg.weights).reduce((a, b) => a + b, 0);
  const scaleFactor = fullWeightSum / usedDivisorPortion;
  const raw = sum / divisor;
  const normalized = raw * scaleFactor;
  return Math.round(normalized * 100) / 100;
}

module.exports = { computeFormScore, computeMasterScore };
