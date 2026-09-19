const express = require('express');
const bcrypt = require('bcryptjs');
const { readSheet, appendRows, updateRowByKey, newId } = require('../storage/excelStorage');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const users = await readSheet('Users');
  res.json(users.map((u) => ({ ...u, Password_Hash: undefined })));
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { Full_Name, Username, Password, Role, Departments, Forms, Bonus_Departments } = req.body;
  if (!Full_Name || !Username || !Password || !Role) {
    return res.status(400).json({ error: 'اطلاعات کاربر ناقص است' });
  }
  const users = await readSheet('Users');
  if (users.find((u) => u.Username === Username)) {
    return res.status(409).json({ error: 'این نام کاربری قبلاً استفاده شده است' });
  }
  const hash = await bcrypt.hash(Password, 10);
  const user = {
    User_ID: newId('user'),
    Full_Name, Username,
    Password_Hash: hash,
    Role,
    Departments: Array.isArray(Departments) ? Departments.join(',') : (Departments || ''),
    Forms: Array.isArray(Forms) ? Forms.join(',') : (Forms || ''),
    Bonus_Departments: Array.isArray(Bonus_Departments) ? Bonus_Departments.join(',') : (Bonus_Departments || ''),
    Active: 'true',
    Created_At: new Date().toISOString(),
  };
  await appendRows('Users', user);
  res.json({ ...user, Password_Hash: undefined });
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const updates = { ...req.body };
  if (updates.Password) {
    updates.Password_Hash = await bcrypt.hash(updates.Password, 10);
    delete updates.Password;
  }
  if (Array.isArray(updates.Departments)) updates.Departments = updates.Departments.join(',');
  if (Array.isArray(updates.Forms)) updates.Forms = updates.Forms.join(',');
  if (Array.isArray(updates.Bonus_Departments)) updates.Bonus_Departments = updates.Bonus_Departments.join(',');
  const ok = await updateRowByKey('Users', 'User_ID', req.params.id, updates);
  if (!ok) return res.status(404).json({ error: 'کاربر یافت نشد' });
  res.json({ success: true });
});

module.exports = router;
