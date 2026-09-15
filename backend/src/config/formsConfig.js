/**
 * این فایل مستقیماً از تحلیل فایل‌های Excel آپلود شده استخراج شده است.
 * هیچ معیار یا فرمولی حدس زده نشده؛ تمام مقادیر از Sheetهای واقعی هر فرم گرفته شده‌اند.
 *
 * ساختار هر فرم:
 *  - id: شناسه فنی فرم (بدون تغییر، برای Storage)
 *  - label: عنوان فارسی فرم (برای UI)
 *  - masterKey: نام ستونی که این فرم در فایل «ارزیابی کل پرسنل» به آن نگاشته می‌شود
 *  - departments: بخش‌هایی که این فرم برایشان فعال است + معیارها و فرمول هرکدام
 *
 * هر Criterion دارای:
 *  - key: نام فنی اصلی ستون در Excel (حفظ شده، تغییر داده نشده)
 *  - label: ترجمه فارسی مفهومی (از شیت "مترجم" هر Workbook استخراج شده)
 *  - weight: ضریب استفاده شده در فرمول محاسبه امتیاز نهایی همان فرم
 *  - scale: مقیاس امتیازدهی (طبق Excel: 1 تا 5)
 */

const SCALE = [1, 2, 3, 4, 5];

const FORMS = {
  responsible: {
    id: 'responsible',
    label: 'نمره دهی مسئول',
    masterKey: 'responsible',
    departments: {
      hall: {
        divisor: 26,
        criteria: [
          { key: 'Clothing', label: 'لباس', weight: 2, scale: SCALE },
          { key: 'Haircut', label: 'تمیزی سر و صورت', weight: 1, scale: SCALE },
          { key: 'Shoes', label: 'کفش', weight: 2, scale: SCALE },
          { key: 'Trousers', label: 'شلوار', weight: 2, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 5, scale: SCALE },
          { key: 'Performing_duties', label: 'انجام وظایف محوله', weight: 3, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 3, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 3, scale: SCALE },
          { key: 'Cost_control', label: 'کنترل هزینه', weight: 3, scale: SCALE },
          { key: 'Trainability', label: 'آموزش‌پذیری', weight: 2, scale: SCALE },
        ],
      },
      callcenter: {
        divisor: 15,
        criteria: [
          { key: 'Performing_duties', label: 'انجام وظایف محوله', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 1, scale: SCALE },
          { key: 'Follow_up', label: 'پیگیری سفارشات', weight: 3, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 2, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 2, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 3, scale: SCALE },
          { key: 'Accuracy_in_recording_receipts', label: 'دقت در ثبت', weight: 1, scale: SCALE },
          { key: 'Sales_prowess', label: 'قدرت فروشندگی', weight: 1, scale: SCALE },
        ],
      },
      cashier: {
        divisor: 13,
        criteria: [
          { key: 'Performing_duties', label: 'انجام وظایف محوله', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 1, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 2, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 4, scale: SCALE },
          { key: 'accuracy', label: 'دقت', weight: 1, scale: SCALE },
          { key: 'Sales_prowess', label: 'قدرت فروشندگی', weight: 2, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      kitchen: {
        divisor: 15,
        criteria: [
          { key: 'Performing_duties', label: 'انجام وظایف محوله', weight: 1, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 1, scale: SCALE },
          { key: 'accuracy', label: 'دقت', weight: 1, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 1, scale: SCALE },
          { key: 'Inter_sectoral_coordination', label: 'هماهنگی بین بخش', weight: 2, scale: SCALE },
          { key: 'Submit_statistics', label: 'ارسال آمار', weight: 1, scale: SCALE },
          { key: 'Skill', label: 'مهارت', weight: 1, scale: SCALE },
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 2, scale: SCALE },
          { key: 'Occupational_hygiene', label: 'بهداشت حین کار', weight: 1, scale: SCALE },
          { key: 'Compliance_with_regulations', label: 'رعایت قوانین', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      production: {
        divisor: 15,
        criteria: [
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 2, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 2, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 2, scale: SCALE },
          { key: 'Performing_duties', label: 'انجام وظایف محوله', weight: 1, scale: SCALE },
          { key: 'Following_the_recipe', label: 'رعایت رسپی', weight: 4, scale: SCALE },
          { key: 'discipline', label: 'نظم', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
    },
  },

  inspector: {
    id: 'inspector',
    label: 'نمره دهی بازرس',
    masterKey: 'inspector',
    departments: {
      kitchen: {
        divisor: 10,
        criteria: [
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 2, scale: SCALE },
          { key: 'Checklist', label: 'چک لیست', weight: 1, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 1, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 1, scale: SCALE },
          { key: 'accuracy', label: 'دقت', weight: 1, scale: SCALE },
          { key: 'Inter_sectoral_coordination', label: 'هماهنگی بین بخش', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      production: {
        divisor: 12,
        criteria: [
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 2, scale: SCALE },
          { key: 'Checklist', label: 'چک لیست', weight: 1, scale: SCALE },
          { key: 'Performance', label: 'عملکرد', weight: 1, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 1, scale: SCALE },
          { key: 'accuracy', label: 'دقت', weight: 1, scale: SCALE },
          { key: 'Following_the_recipe', label: 'رعایت رسپی', weight: 3, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
    },
  },

  hygiene: {
    id: 'hygiene',
    label: 'نمره دهی بهداشت',
    masterKey: 'hygiene',
    departments: {
      kitchen: {
        divisor: 16,
        criteria: [
          { key: 'Uniform', label: 'لباس فرم', weight: 2, scale: SCALE },
          { key: 'Health_Card', label: 'کارت بهداشت', weight: 2, scale: SCALE },
          { key: 'Health_Certificate', label: 'گواهینامه بهداشت', weight: 1, scale: SCALE },
          { key: 'Checklist', label: 'چک لیست', weight: 1, scale: SCALE },
          { key: 'Storage_Instructions_for_Materials', label: 'نحوه نگهداری مواد', weight: 3, scale: SCALE },
          { key: 'Critical_signs', label: 'علائم بحرانی', weight: 4, scale: SCALE },
          { key: 'Workplace_cleanliness', label: 'تمیزی محیط کار', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 2, scale: SCALE },
        ],
      },
      production: {
        divisor: 16,
        criteria: [
          { key: 'Uniform', label: 'لباس فرم', weight: 2, scale: SCALE },
          { key: 'Health_Card', label: 'کارت بهداشت', weight: 2, scale: SCALE },
          { key: 'Health_Certificate', label: 'گواهینامه بهداشت', weight: 1, scale: SCALE },
          { key: 'Checklist', label: 'چک لیست', weight: 1, scale: SCALE },
          { key: 'Storage_Instructions_for_Materials', label: 'نحوه نگهداری مواد', weight: 3, scale: SCALE },
          { key: 'Critical_signs', label: 'علائم بحرانی', weight: 4, scale: SCALE },
          { key: 'Workplace_cleanliness', label: 'تمیزی محیط کار', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 2, scale: SCALE },
        ],
      },
    },
  },

  salesteam: {
    id: 'salesteam',
    label: 'نمره دهی تیم فروش',
    masterKey: 'salesteam',
    departments: {
      callcenter: {
        divisor: 10,
        criteria: [
          { key: 'Sales_prowess', label: 'قدرت فروشندگی', weight: 3, scale: SCALE },
          { key: 'Punctual_attendance', label: 'حضور به‌موقع', weight: 1, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 1, scale: SCALE },
          { key: 'Skill', label: 'مهارت', weight: 2, scale: SCALE },
          { key: 'Active_participation', label: 'حضور فعال', weight: 2, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      cashier: {
        divisor: 10,
        criteria: [
          { key: 'Sales_prowess', label: 'قدرت فروشندگی', weight: 3, scale: SCALE },
          { key: 'Punctual_attendance', label: 'حضور به‌موقع', weight: 1, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 1, scale: SCALE },
          { key: 'Skill', label: 'مهارت', weight: 2, scale: SCALE },
          { key: 'Active_participation', label: 'حضور فعال', weight: 2, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
    },
  },

  camera: {
    id: 'camera',
    label: 'نمره دهی دوربین',
    masterKey: 'camera',
    departments: {
      hall: {
        divisor: 10,
        criteria: [
          { key: 'Violations', label: 'تخلفات', weight: 3, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 2, scale: SCALE },
          { key: 'Speed', label: 'سرعت', weight: 2, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 2, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      callcenter: {
        divisor: 9,
        criteria: [
          { key: 'Violations', label: 'تخلفات', weight: 5, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 1, scale: SCALE },
          { key: 'Response_speed', label: 'سرعت پاسخگویی', weight: 1, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      cashier: {
        divisor: 8,
        criteria: [
          { key: 'Violations', label: 'تخلفات', weight: 5, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 1, scale: SCALE },
          { key: 'Encounter', label: 'نوع برخورد', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      kitchen: {
        divisor: 15,
        criteria: [
          { key: 'Violations', label: 'تخلفات', weight: 5, scale: SCALE },
          { key: 'Uniform', label: 'لباس فرم', weight: 2, scale: SCALE },
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 3, scale: SCALE },
          { key: 'Grazing', label: 'ریزه‌خواری', weight: 2, scale: SCALE },
          { key: 'Fast_cooking', label: 'سرعت طبخ غذا', weight: 1, scale: SCALE },
          { key: 'accuracy', label: 'دقت', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      production: {
        divisor: 12,
        criteria: [
          { key: 'Violations', label: 'تخلفات', weight: 4, scale: SCALE },
          { key: 'Maintaining_hygiene', label: 'رعایت بهداشت', weight: 2, scale: SCALE },
          { key: 'Coverage', label: 'پوشش', weight: 2, scale: SCALE },
          { key: 'Following_the_recipe', label: 'رعایت رسپی', weight: 3, scale: SCALE },
          { key: 'Workplace_cleanliness', label: 'تمیزی محیط کار', weight: 1, scale: SCALE },
        ],
      },
    },
  },

  hr: {
    id: 'hr',
    label: 'نمره دهی منابع انسانی',
    masterKey: 'hr',
    departments: {
      hall: {
        divisor: 4,
        criteria: [
          { key: 'Discipline_in_entry_and_exit', label: 'نظم ورود و خروج', weight: 2, scale: SCALE },
          { key: 'Fingerprint_registration', label: 'ثبت صحیح انگشتی', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      callcenter: {
        divisor: 4,
        criteria: [
          { key: 'Discipline_in_entry_and_exit', label: 'نظم ورود و خروج', weight: 2, scale: SCALE },
          { key: 'Fingerprint_registration', label: 'ثبت صحیح انگشتی', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      cashier: {
        divisor: 4,
        criteria: [
          { key: 'Discipline_in_entry_and_exit', label: 'نظم ورود و خروج', weight: 2, scale: SCALE },
          { key: 'Fingerprint_registration', label: 'ثبت صحیح انگشتی', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      kitchen: {
        divisor: 4,
        criteria: [
          { key: 'Discipline_in_entry_and_exit', label: 'نظم ورود و خروج', weight: 2, scale: SCALE },
          { key: 'Fingerprint_registration', label: 'ثبت صحیح انگشتی', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
      production: {
        divisor: 4,
        criteria: [
          { key: 'Discipline_in_entry_and_exit', label: 'نظم ورود و خروج', weight: 2, scale: SCALE },
          { key: 'Fingerprint_registration', label: 'ثبت صحیح انگشتی', weight: 1, scale: SCALE },
          { key: 'Overall_assessment', label: 'ارزیابی کل', weight: 1, scale: SCALE },
        ],
      },
    },
  },
};

// نام بخش‌ها (فنی -> فارسی) — دقیقاً بر اساس نام Sheetهای Excel
const DEPARTMENTS = {
  hall: { id: 'hall', label: 'سالن' },
  callcenter: { id: 'callcenter', label: 'کال سنتر (اپراتور)' },
  cashier: { id: 'cashier', label: 'صندوق' },
  kitchen: { id: 'kitchen', label: 'آشپزخانه' },
  production: { id: 'production', label: 'تولید' },
};

// وزن‌های محاسبه امتیاز نهایی (فایل «ارزیابی کل پرسنل») به ازای هر بخش
// این وزن‌ها روی خروجی "Score" هر فرم اعمال می‌شوند، نه روی معیارهای خام
const MASTER_WEIGHTS = {
  hall: { divisor: 5, weights: { responsible: 1.75, system: 1.75, camera: 1, hr: 0.5 } },
  callcenter: { divisor: 5, weights: { responsible: 1, system: 1.5, camera: 0.75, hr: 0.25, salesteam: 1.5 } },
  cashier: { divisor: 5, weights: { responsible: 1.25, system: 1.5, camera: 0.5, hr: 0.25, salesteam: 1.5 } },
  kitchen: { divisor: 5, weights: { responsible: 1.25, system: 1.25, camera: 0.75, hr: 0.25, hygiene: 0.75, inspector: 0.75 } },
  production: { divisor: 5, weights: { responsible: 1.25, system: 1.25, camera: 0.75, hr: 0.25, hygiene: 0.75, inspector: 0.75 } },
};
// توجه (ASSUMPTION مستند شده در README): ستون "system" (سیستم) در فایل «ارزیابی کل پرسنل»
// در هیچ‌کدام از فرم‌های نمره‌دهی تولید نمی‌شود؛ در این پیاده‌سازی به صورت مقدار قابل ثبت دستی
// توسط ادمین برای هر پرسنل/دوره در نظر گرفته شده است.

function getFormsForDepartment(deptId) {
  return Object.values(FORMS).filter((f) => !!f.departments[deptId]);
}

module.exports = { FORMS, DEPARTMENTS, MASTER_WEIGHTS, getFormsForDepartment, SCALE };
