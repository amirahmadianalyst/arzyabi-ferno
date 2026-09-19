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

// طراحی جدید پاداش/جریمه: بر اساس بخش (نه نقش خاص). هر واحد امتیاز معادل مبلغ ثابت زیر است.
const BONUS_UNIT_AMOUNT = 5000; // تومان به ازای هر امتیاز
const BONUS_TYPES = {
  BONUS: { id: 'BONUS', label: 'پاداش' },
  PENALTY: { id: 'PENALTY', label: 'جریمه' },
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

module.exports = { INITIAL_EMPLOYEES, EVALUATOR_ROLES, BONUS_UNIT_AMOUNT, BONUS_TYPES, FIELD_LABELS };
