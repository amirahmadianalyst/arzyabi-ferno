/**
 * Storage Layer — Excel
 * -----------------------------------------------------------------------
 * تمام دسترسی به data/ferno_evaluations.xlsx از این ماژول عبور می‌کند.
 * معماری طوری طراحی شده که در آینده بتوان این فایل را با یک
 * storage/postgresStorage.js با همان Interface جایگزین کرد
 * (تمام متدها async هستند و امضای یکسانی با یک لایه DB واقعی دارند).
 *
 * قانون طلایی: هیچ رکورد قبلی هرگز Overwrite یا Delete نمی‌شود.
 * هر عملیات نوشتن ابتدا کل Workbook را می‌خواند، ردیف جدید را Append
 * می‌کند و کل Workbook را دوباره ذخیره می‌کند. قبل از هر نوشتن، از فایل
 * فعلی یک Backup گرفته می‌شود.
 *
 * سازگاری با نسخه‌های قدیمی‌تر Schema: اگر ساختار یک Sheet در فایل موجود
 * (روی دیسک) با تعریف فعلی SHEETS فرق داشته باشد (مثلاً بعد از یک Update
 * به سامانه)، دو حالت داریم:
 *   ۱) فقط چند ستون جدید اضافه شده‌اند → ستون‌های جدید در انتهای همان Sheet
 *      اضافه می‌شوند و داده‌های قبلی دست‌نخورده می‌مانند.
 *   ۲) ساختار کاملاً متفاوت است (مثلاً بازطراحی کامل Bonus_Records) → کل
 *      Sheet قدیمی با نام «..._legacy» نگه‌داشته می‌شود (نه حذف!) و یک
 *      Sheet جدید با ساختار درست ساخته می‌شود.
 * خواندن/نوشتن همیشه بر اساس نام واقعی Headerهای فیزیکی فایل انجام می‌شود،
 * نه بر اساس فرض ثابت بودن ترتیب ستون‌ها.
 */

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_PATH = path.join(DATA_DIR, 'ferno_evaluations.xlsx');

// تعریف Sheetها و ستون‌های هرکدام (Schema داخلی سامانه)
const SHEETS = {
  Evaluations: [
    'Evaluation_ID', 'Employee_ID', 'Employee_Name', 'Department', 'Evaluator_ID', 'Evaluator_Name',
    'Form_ID', 'Year', 'Month', 'Week', 'Average_Score', 'Notes', 'Status', 'Created_At', 'Updated_At',
  ],
  Evaluation_Scores: ['Evaluation_ID', 'Criterion_ID', 'Criterion_Name', 'Score', 'Comment'],
  Employees: ['Employee_ID', 'Employee_Name', 'Department', 'Active', 'Created_At'],
  Users: ['User_ID', 'Full_Name', 'Username', 'Password_Hash', 'Role', 'Departments', 'Forms', 'Bonus_Departments', 'Active', 'Created_At'],
  Departments: ['Department_ID', 'Department_Name', 'Active'],
  Periods: ['Period_ID', 'Year', 'Month', 'Week', 'Is_Active', 'Created_At'],
  Audit_Log: ['Log_ID', 'User_ID', 'Username', 'Action', 'Details', 'Created_At'],
  Manual_Scores: ['Manual_Score_ID', 'Employee_ID', 'Employee_Name', 'Department', 'Metric', 'Year', 'Month', 'Week', 'Score', 'Set_By', 'Created_At'],
  // طراحی جدید پاداش/جریمه: مبتنی بر بخش + امتیاز واحد (هر امتیاز = مبلغ ثابت)
  Bonus_Records: [
    'Bonus_ID', 'Date', 'Department', 'Employee_ID', 'Employee_Name',
    'Evaluator_ID', 'Evaluator_Name', 'Type', 'Score', 'Amount', 'Notes', 'Created_At',
  ],
};

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createEmptyWorkbook() {
  const wb = new ExcelJS.Workbook();
  for (const [sheetName, columns] of Object.entries(SHEETS)) {
    const ws = wb.addWorksheet(sheetName);
    ws.addRow(columns);
    ws.getRow(1).font = { bold: true };
  }
  return wb;
}

async function ensureDatabaseExists() {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const wb = await createEmptyWorkbook();
    await wb.xlsx.writeFile(DB_PATH);
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function backupCurrentFile() {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) return null;
  const backupPath = path.join(BACKUP_DIR, `ferno_evaluations_${timestamp()}.xlsx`);
  fs.copyFileSync(DB_PATH, backupPath);
  return backupPath;
}

function readHeaderRow(ws) {
  return ws.getRow(1).values.slice(1).map((v) => (v === undefined || v === null ? '' : String(v)));
}

/**
 * اطمینان از این‌که یک Sheet مطابق Schema فعلی (SHEETS[sheetName]) است.
 * اگر وجود نداشته باشد می‌سازد. اگر ساختار قدیمی/متفاوت داشته باشد، طبق
 * توضیح بالای فایل، بدون حذف داده مهاجرت می‌کند.
 */
function ensureSheetSchema(wb, sheetName) {
  const columns = SHEETS[sheetName];
  let ws = wb.getWorksheet(sheetName);

  if (!ws) {
    ws = wb.addWorksheet(sheetName);
    ws.addRow(columns);
    ws.getRow(1).font = { bold: true };
    return;
  }

  const headerRow = readHeaderRow(ws);
  const isEmpty = headerRow.every((h) => !h);
  if (isEmpty) {
    ws.getRow(1).values = [undefined, ...columns];
    ws.getRow(1).font = { bold: true };
    return;
  }

  const sameSchema = headerRow.length === columns.length && columns.every((c, i) => headerRow[i] === c);
  if (sameSchema) return;

  const extra = headerRow.filter((h) => h && !columns.includes(h));
  if (extra.length > 0) {
    // ساختار قدیمی/ناسازگار: به‌جای حذف، کل Sheet قدیمی را با نام Legacy نگه می‌داریم
    let legacyName = `${sheetName}_legacy`;
    let counter = 1;
    while (wb.getWorksheet(legacyName)) {
      legacyName = `${sheetName}_legacy_${counter}`;
      counter += 1;
    }
    const legacyWs = wb.addWorksheet(legacyName);
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      legacyWs.getRow(rowNumber).values = row.values;
    });
    wb.removeWorksheet(ws.id);
    const freshWs = wb.addWorksheet(sheetName);
    freshWs.addRow(columns);
    freshWs.getRow(1).font = { bold: true };
  } else {
    // فقط ستون‌های جدید اضافه شده‌اند؛ آن‌ها را در انتهای همان Sheet اضافه می‌کنیم
    // (داده‌های قبلی و ترتیب فیزیکی ستون‌های موجود دست‌نخورده باقی می‌ماند)
    const missing = columns.filter((c) => !headerRow.includes(c));
    missing.forEach((col, idx) => {
      ws.getRow(1).getCell(headerRow.length + idx + 1).value = col;
    });
    ws.getRow(1).font = { bold: true };
  }
}

async function loadWorkbook() {
  await ensureDatabaseExists();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(DB_PATH);
  for (const sheetName of Object.keys(SHEETS)) {
    ensureSheetSchema(wb, sheetName);
  }
  return wb;
}

function sheetToObjects(ws) {
  const headerRow = ws.getRow(1).values.slice(1); // exceljs 1-indexed, first is empty
  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const rowValues = ws.getRow(r).values.slice(1);
    if (rowValues.every((v) => v === undefined || v === null || v === '')) continue;
    const obj = {};
    headerRow.forEach((h, idx) => {
      if (!h) return;
      obj[h] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

async function readSheet(sheetName) {
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  return sheetToObjects(ws);
}

/**
 * Append کردن یک یا چند ردیف جدید به یک Sheet، بدون از بین بردن داده‌های قبلی.
 * قبل از نوشتن، از فایل فعلی Backup گرفته می‌شود. نگاشت مقادیر به ستون‌ها بر
 * اساس نام واقعی Header فیزیکی سطر اول انجام می‌شود (نه ترتیب فرضی)، تا در
 * صورت مهاجرت Schema (بخش بالا) هم داده‌ها همیشه زیر ستون درست بنشینند.
 */
async function appendRows(sheetName, rowsData) {
  await backupCurrentFile();
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(sheetName);
  if (!SHEETS[sheetName]) throw new Error(`Sheet ناشناخته: ${sheetName}`);

  const physicalHeaders = readHeaderRow(ws);
  const list = Array.isArray(rowsData) ? rowsData : [rowsData];
  for (const rowObj of list) {
    const rowArray = physicalHeaders.map((h) => (h && rowObj[h] !== undefined ? rowObj[h] : ''));
    ws.addRow(rowArray);
  }
  await wb.xlsx.writeFile(DB_PATH);
  return list;
}

/**
 * به‌روزرسانی یک ردیف موجود بر اساس ستون کلید (مثلاً Evaluation_ID).
 * این عملیات هم قبل از نوشتن Backup می‌گیرد. سایر ردیف‌ها دست‌نخورده باقی می‌مانند.
 */
async function updateRowByKey(sheetName, keyColumn, keyValue, updates) {
  await backupCurrentFile();
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(sheetName);
  if (!SHEETS[sheetName]) throw new Error(`Sheet ناشناخته: ${sheetName}`);

  const physicalHeaders = readHeaderRow(ws);
  const keyIdx = physicalHeaders.indexOf(keyColumn) + 1;
  let updated = false;
  for (let r = 2; r <= ws.rowCount; r++) {
    const cellVal = ws.getRow(r).getCell(keyIdx).value;
    if (String(cellVal) === String(keyValue)) {
      for (const [k, v] of Object.entries(updates)) {
        const colIdx = physicalHeaders.indexOf(k) + 1;
        if (colIdx > 0) ws.getRow(r).getCell(colIdx).value = v;
      }
      updated = true;
      break;
    }
  }
  if (updated) await wb.xlsx.writeFile(DB_PATH);
  return updated;
}

async function deleteRowsByFilter(sheetName, predicate) {
  // فقط برای موارد مدیریتی خاص استفاده می‌شود (مثلاً حذف کاربر تستی)؛
  // ارزیابی‌ها هرگز از این متد حذف نمی‌شوند.
  await backupCurrentFile();
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(sheetName);
  const columns = SHEETS[sheetName];
  const rows = sheetToObjects(ws);
  const kept = rows.filter((r) => !predicate(r));
  wb.removeWorksheet(ws.id);
  const newWs = wb.addWorksheet(sheetName);
  newWs.addRow(columns);
  newWs.getRow(1).font = { bold: true };
  kept.forEach((r) => newWs.addRow(columns.map((c) => r[c] ?? '')));
  await wb.xlsx.writeFile(DB_PATH);
  return kept.length;
}

function newId(prefix) {
  return `${prefix}-${uuidv4()}`;
}

module.exports = {
  DB_PATH,
  BACKUP_DIR,
  SHEETS,
  ensureDatabaseExists,
  backupCurrentFile,
  loadWorkbook,
  readSheet,
  appendRows,
  updateRowByKey,
  deleteRowsByFilter,
  newId,
};
