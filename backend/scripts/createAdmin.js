require('dotenv').config();
const bcrypt = require('bcryptjs');
const { readSheet, appendRows, updateRowByKey, newId, ensureDatabaseExists } = require('../src/storage/excelStorage');

async function main() {
  await ensureDatabaseExists();
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const users = await readSheet('Users');
  const existing = users.find((u) => u.Username === username);
  const hash = await bcrypt.hash(password, 10);

  if (existing) {
    await updateRowByKey('Users', 'User_ID', existing.User_ID, { Password_Hash: hash, Active: 'true', Role: 'ADMIN' });
    console.log(`✅ رمز عبور ادمین «${username}» به‌روزرسانی شد.`);
  } else {
    await appendRows('Users', {
      User_ID: newId('user'),
      Full_Name: 'مدیر سامانه',
      Username: username,
      Password_Hash: hash,
      Role: 'ADMIN',
      Departments: '',
      Forms: '',
      Active: 'true',
      Created_At: new Date().toISOString(),
    });
    console.log(`✅ کاربر ادمین «${username}» ایجاد شد.`);
  }
  console.log(`   نام کاربری: ${username}`);
  console.log(`   رمز عبور:   ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
