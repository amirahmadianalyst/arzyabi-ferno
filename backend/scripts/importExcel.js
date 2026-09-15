/**
 * Import اولیه اطلاعات از داده‌های استخراج‌شده از Excel (INITIAL_EMPLOYEES در referenceData.js)
 * به data/ferno_evaluations.xlsx
 *
 * منبع داده: Sheet «مرجع» در فایل‌های آپلود شده (ستون‌های «اسامی پرسنل ...»)
 * منبع بخش‌ها: نام Sheetهای واقعی در فایل‌های نمره‌دهی
 * اجرا: npm run import:excel
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { readSheet, appendRows, newId, ensureDatabaseExists } = require('../src/storage/excelStorage');
const { INITIAL_EMPLOYEES } = require('../src/config/referenceData');
const { DEPARTMENTS } = require('../src/config/formsConfig');

async function main() {
  await ensureDatabaseExists();

  // --- بخش‌ها ---
  const existingDepts = await readSheet('Departments');
  if (existingDepts.length === 0) {
    const deptRows = Object.values(DEPARTMENTS).map((d) => ({
      Department_ID: d.id, Department_Name: d.label, Active: 'true',
    }));
    await appendRows('Departments', deptRows);
    console.log(`✅ ${deptRows.length} بخش وارد شد.`);
  } else {
    console.log('ℹ️  بخش‌ها قبلاً وارد شده‌اند، رد شد.');
  }

  // --- پرسنل ---
  const existingEmployees = await readSheet('Employees');
  const existingKeys = new Set(existingEmployees.map((e) => `${e.Employee_Name}|${e.Department}`));
  const newEmployees = [];
  for (const [deptId, names] of Object.entries(INITIAL_EMPLOYEES)) {
    for (const name of names) {
      const key = `${name}|${deptId}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      newEmployees.push({
        Employee_ID: newId('emp'),
        Employee_Name: name,
        Department: deptId,
        Active: 'true',
        Created_At: new Date().toISOString(),
      });
    }
  }
  if (newEmployees.length > 0) {
    await appendRows('Employees', newEmployees);
    console.log(`✅ ${newEmployees.length} پرسنل جدید وارد شد.`);
  } else {
    console.log('ℹ️  پرسنلی برای Import جدید یافت نشد (شاید قبلاً وارد شده‌اند).');
  }

  // --- کاربران نمونه برای هر نقش ارزیاب (برای تست فوری سیستم) ---
  const existingUsers = await readSheet('Users');
  const sampleUsers = [
    { username: 'responsible1', full: 'مسئول بخش (نمونه)', role: 'responsible', depts: Object.keys(DEPARTMENTS) },
    { username: 'inspector1', full: 'بازرس (نمونه)', role: 'inspector', depts: ['kitchen', 'production'] },
    { username: 'hygiene1', full: 'مسئول بهداشت (نمونه)', role: 'hygiene', depts: ['kitchen', 'production'] },
    { username: 'sales1', full: 'مسئول فروش (نمونه)', role: 'salesteam', depts: ['callcenter', 'cashier'] },
    { username: 'camera1', full: 'مسئول دوربین (نمونه)', role: 'camera', depts: Object.keys(DEPARTMENTS) },
    { username: 'hr1', full: 'مسئول منابع انسانی (نمونه)', role: 'hr', depts: Object.keys(DEPARTMENTS) },
  ];
  const defaultPass = 'eval123';
  const hash = await bcrypt.hash(defaultPass, 10);
  const toCreate = [];
  for (const su of sampleUsers) {
    if (existingUsers.find((u) => u.Username === su.username)) continue;
    toCreate.push({
      User_ID: newId('user'),
      Full_Name: su.full,
      Username: su.username,
      Password_Hash: hash,
      Role: 'EVALUATOR',
      Departments: su.depts.join(','),
      Forms: su.role,
      Active: 'true',
      Created_At: new Date().toISOString(),
    });
  }
  if (toCreate.length > 0) {
    await appendRows('Users', toCreate);
    console.log(`✅ ${toCreate.length} کاربر ارزیاب نمونه ایجاد شد (رمز عبور همه: ${defaultPass})`);
    toCreate.forEach((u) => console.log(`   - ${u.Username} (${u.Full_Name})`));
  } else {
    console.log('ℹ️  کاربران ارزیاب نمونه قبلاً وجود دارند.');
  }

  // --- Period اولیه ---
  const existingPeriods = await readSheet('Periods');
  if (existingPeriods.length === 0) {
    await appendRows('Periods', {
      Period_ID: newId('period'),
      Year: 1405, Month: 'شهریور', Week: 2,
      Is_Active: 'true',
      Created_At: new Date().toISOString(),
    });
    console.log('✅ Period اولیه (1405 / شهریور / هفته 2) ایجاد و فعال شد.');
  } else {
    console.log('ℹ️  Periodها قبلاً وجود دارند.');
  }

  console.log('\n🎉 Import با موفقیت انجام شد.');
}

main().catch((e) => { console.error(e); process.exit(1); });
