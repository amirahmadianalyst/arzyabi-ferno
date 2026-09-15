/**
 * استخراج‌شده از Sheet «مرجع» در فایل‌های Excel.
 * فهرست پرسنل هر بخش دقیقاً از ستون‌های «اسامی پرسنل ...» گرفته شده است.
 */

const INITIAL_EMPLOYEES = {
  hall: ['قاسمی', 'زنگنه', 'صفری', 'اسمائیلی', 'خیرخواه', 'سلامتی', 'فاضلی', 'سجادپور', 'حسن زاده', 'یعقوب نژاد', 'شهاب احمدی'],
  callcenter: ['جوان دوست', 'خوشدل', 'مظفری', 'باغ خوانی'],
  cashier: ['ترکانلو', 'غازی', 'دل بینا', 'فیضی'],
  kitchen: ['آشوری', 'محمدی', 'خوش خصلت', 'موذنی', 'سیدان', 'هاشم زهی', 'قربانی', 'مجیدی', 'رهنما', 'فاضل'],
  production: ['جوان دوست', 'قاسمی', 'جهاندیده', 'رحیمی', 'رهنما', 'مسعودی', 'حسین زاده'],
};

// نگاشت نقش‌های ارزیاب (Evaluator Roles) به فرم مجاز؛ هر Role دقیقاً معادل یکی از فایل‌های
// «نمره دهی ...» است که برای آن ساخته شده.
const EVALUATOR_ROLES = {
  responsible: { id: 'responsible', label: 'مسئول بخش' },
  inspector: { id: 'inspector', label: 'بازرس' },
  hygiene: { id: 'hygiene', label: 'مسئول بهداشت' },
  salesteam: { id: 'salesteam', label: 'مسئول فروش' },
  camera: { id: 'camera', label: 'مسئول دوربین' },
  hr: { id: 'hr', label: 'مسئول منابع انسانی' },
};

// بخش‌های Bonus (پاداش) — دارای منطق کاملاً متفاوت (کسر جریمه از مبلغ پایه، به صورت روزانه)
// استخراج شده از Sheetهای پاداش در فایل «ارزیابی کل پرسنل»
const BONUS_ROLES = {
  hall_counter: {
    id: 'hall_counter',
    label: 'کانتر سالن (پاداش)',
    baseAmount: 200000,
    frequency: 'daily',
    items: [
      { key: 'delay', label: 'تاخیر', unitPenalty: 20000 },
      { key: 'cold_food', label: 'سردی غذا', unitPenalty: 80000 }, // (40000*2) طبق فرمول اصلی
      { key: 'drink_mismatch', label: 'مغایرت نوشیدنی', unitPenalty: 50000 },
      { key: 'food_dissatisfaction', label: 'نارضایتی غذا', unitPenalty: 20000 },
    ],
  },
  delivery_counter: {
    id: 'delivery_counter',
    label: 'کانتر ارسال (پاداش)',
    baseAmount: 400000,
    frequency: 'daily',
    items: [
      { key: 'delay_20', label: 'تاخیر (۲۰ دقیقه)', unitPenalty: 20000 },
      { key: 'cold_food_30', label: 'سردی غذا', unitPenalty: 30000 },
      { key: 'mismatch_30', label: 'مغایرت', unitPenalty: 30000 },
      { key: 'time_over_20min', label: 'تایم بالای ۲۰ دقیقه', unitPenalty: 3000 },
      { key: 'rating_1_or_2', label: 'امتیاز ۱ یا ۲ (اسنپ/تپسی)', unitPenalty: 15000 },
    ],
  },
  head_peyk: {
    id: 'head_peyk',
    label: 'سرپیک (پاداش)',
    baseAmount: 200000,
    frequency: 'daily',
    items: [
      { key: 'receipt_3of5', label: 'فیش (۳ از ۵)', unitPenalty: 5000 },
      { key: 'behavior', label: 'رفتار', unitPenalty: 100000 },
      { key: 'mistake', label: 'اشتباه', unitPenalty: 20000 },
      { key: 'food_delay', label: 'تاخیر غذا', unitPenalty: 20000 },
      { key: 'cold_food', label: 'سردی غذا', unitPenalty: 30000 },
    ],
  },
  head_operator: {
    id: 'head_operator',
    label: 'سراپراتور (پاداش)',
    baseAmount: 200000,
    frequency: 'daily',
    items: [
      { key: 'missed_call', label: 'تماس از دست رفته', unitPenalty: 2000 },
      { key: 'wrong_address', label: 'آدرس اشتباه در ثبت سفارش', unitPenalty: 20000 },
      { key: 'bad_tone', label: 'ویس/لحن و رفتار نامناسب', unitPenalty: 30000 },
      { key: 'food_delay', label: 'تاخیر غذا', unitPenalty: 30000 },
      { key: 'cold_food', label: 'سردی غذا', unitPenalty: 50000 },
    ],
  },
};

// فیلدهای فنی -> برچسب فارسی برای کل سامانه (از Sheet «مترجم» ادغام شده از تمام فایل‌ها)
const FIELD_LABELS = {
  Row: 'ردیف', Year: 'سال', Month: 'ماه', Week: 'هفته',
  Employee_ID: 'شناسه پرسنل', Employee_Name: 'نام پرسنل', Full_Name: 'نام و نام خانوادگی',
  Department: 'بخش', Evaluator: 'ارزیاب', Evaluator_ID: 'شناسه ارزیاب', Evaluator_Name: 'نام ارزیاب',
  Form_ID: 'فرم ارزیابی', Average_Score: 'میانگین امتیاز', Score: 'نمره', Notes: 'توضیحات',
  Created_At: 'تاریخ ثبت', Updated_At: 'تاریخ به‌روزرسانی', Status: 'وضعیت',
  Username: 'نام کاربری', Password: 'رمز عبور', Role: 'نقش', Active: 'وضعیت فعالیت',
  Evaluation_ID: 'شناسه ارزیابی', Criterion_ID: 'شناسه معیار', Criterion_Name: 'نام معیار', Comment: 'توضیح',
};

module.exports = { INITIAL_EMPLOYEES, EVALUATOR_ROLES, BONUS_ROLES, FIELD_LABELS };
