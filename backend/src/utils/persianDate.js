/**
 * محاسبه خودکار «دوره» (سال/ماه/هفته شمسی) و بررسی «روز مجاز ارزیابی»
 * -----------------------------------------------------------------------
 * طبق درخواست: به‌جای این‌که ادمین دستی سال/ماه/هفته را تعیین کند، سامانه
 * به‌صورت خودکار بر اساس تاریخ واقعی (به وقت تهران) این مقادیر را محاسبه
 * می‌کند. روزهای مجاز برای «ثبت» ارزیابی توسط Evaluator فقط پنجشنبه و
 * جمعه است؛ ادمین از این محدودیت مستثنی است (دسترسی ادمین همیشه باز است).
 *
 * تبدیل میلادی به شمسی: پیاده‌سازی الگوریتم استاندارد و متن‌باز jalaali-js
 * (بدون نیاز به هیچ پکیج خارجی، چون امکان npm install آفلاین نبود).
 * صحت این الگوریتم به‌صورت مستقل تست شده: 2026-09-17 → 1405/06/26 ✅
 */

function div(a, b) {
  return ~~(a / b);
}
function mod(a, b) {
  return a - ~~(a / b) * b;
}

function jalCal(jy) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm, jump;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error('سال شمسی خارج از محدوده پشتیبانی‌شده است: ' + jy);
  }

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + div(gm - 8, 6) + 100100, 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return [gy, gm, gd];
}

function d2j(jdn) {
  const gy = d2g(jdn)[0];
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd, jm, k;

  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return [jy, jm, jd];
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return [jy, jm, jd];
}

function toJalali(gy, gm, gd) {
  const [jy, jm, jd] = d2j(g2d(gy, gm, gd));
  return { jy, jm, jd };
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEKDAY_FA = {
  Sat: 'شنبه', Sun: 'یکشنبه', Mon: 'دوشنبه', Tue: 'سه‌شنبه',
  Wed: 'چهارشنبه', Thu: 'پنجشنبه', Fri: 'جمعه',
};

// روزهای مجاز برای ثبت ارزیابی (طبق درخواست: پنجشنبه و جمعه)
const EVALUATION_ALLOWED_WEEKDAYS = ['Thu', 'Fri'];

/**
 * تاریخ و ساعت فعلی را به وقت تهران (Asia/Tehran) برمی‌گرداند، مستقل از
 * منطقه زمانی سروری که برنامه روی آن اجرا می‌شود (مثلاً Render که UTC است).
 */
function getTehranDateParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return {
    gy: Number(map.year),
    gm: Number(map.month),
    gd: Number(map.day),
    weekdayShort: map.weekday, // 'Thu', 'Fri', ...
  };
}

/**
 * محاسبه خودکار دوره فعلی: سال/ماه/هفته شمسی + وضعیت «روز مجاز ارزیابی».
 * week: هفته‌ی جاری در ماه شمسی، به‌صورت ceil(روز/۷) محاسبه می‌شود
 * (این یک ASSUMPTION مستند‌شده است چون Excel مفهوم «هفته» را دقیقاً
 * تعریف نکرده بود؛ به README مراجعه کنید).
 */
function getCurrentPeriodInfo(date = new Date()) {
  const { gy, gm, gd, weekdayShort } = getTehranDateParts(date);
  const { jy, jm, jd } = toJalali(gy, gm, gd);
  const week = Math.ceil(jd / 7);
  const isEvaluationDay = EVALUATION_ALLOWED_WEEKDAYS.includes(weekdayShort);

  return {
    Year: jy,
    Month: PERSIAN_MONTHS[jm - 1],
    Week: week,
    WeekdayShort: weekdayShort,
    WeekdayFa: WEEKDAY_FA[weekdayShort] || weekdayShort,
    IsEvaluationDay: isEvaluationDay,
    AllowedDaysLabel: 'پنجشنبه و جمعه',
  };
}

module.exports = { toJalali, getCurrentPeriodInfo, getTehranDateParts, PERSIAN_MONTHS, WEEKDAY_FA };
