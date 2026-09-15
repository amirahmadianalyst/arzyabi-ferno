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
  Users: ['User_ID', 'Full_Name', 'Username', 'Password_Hash', 'Role', 'Departments', 'Forms', 'Active', 'Created_At'],
  Departments: ['Department_ID', 'Department_Name', 'Active'],
  Periods: ['Period_ID', 'Year', 'Month', 'Week', 'Is_Active', 'Created_At'],
  Audit_Log: ['Log_ID', 'User_ID', 'Username', 'Action', 'Details', 'Created_At'],
  Manual_Scores: ['Manual_Score_ID', 'Employee_ID', 'Employee_Name', 'Department', 'Metric', 'Year', 'Month', 'Week', 'Score', 'Set_By', 'Created_At'],
  Bonus_Records: ['Bonus_ID', 'Bonus_Role', 'Employee_Name', 'Date', 'Items_JSON', 'Base_Amount', 'Final_Amount', 'Recorded_By', 'Created_At'],
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

async function loadWorkbook() {
  await ensureDatabaseExists();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(DB_PATH);
  // اطمینان از وجود همه Sheetهای مورد نیاز (سازگاری با نسخه‌های قدیمی‌تر فایل)
  for (const [sheetName, columns] of Object.entries(SHEETS)) {
    if (!wb.getWorksheet(sheetName)) {
      const ws = wb.addWorksheet(sheetName);
      ws.addRow(columns);
      ws.getRow(1).font = { bold: true };
    }
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
 * قبل از نوشتن، از فایل فعلی Backup گرفته می‌شود.
 */
async function appendRows(sheetName, rowsData) {
  await backupCurrentFile();
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(sheetName);
  const columns = SHEETS[sheetName];
  if (!columns) throw new Error(`Sheet ناشناخته: ${sheetName}`);

  const list = Array.isArray(rowsData) ? rowsData : [rowsData];
  for (const rowObj of list) {
    const rowArray = columns.map((c) => (rowObj[c] !== undefined ? rowObj[c] : ''));
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
  const columns = SHEETS[sheetName];
  if (!columns) throw new Error(`Sheet ناشناخته: ${sheetName}`);
  const keyIdx = columns.indexOf(keyColumn) + 1; // 1-indexed for exceljs
  let updated = false;
  for (let r = 2; r <= ws.rowCount; r++) {
    const cellVal = ws.getRow(r).getCell(keyIdx).value;
    if (String(cellVal) === String(keyValue)) {
      for (const [k, v] of Object.entries(updates)) {
        const colIdx = columns.indexOf(k) + 1;
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
