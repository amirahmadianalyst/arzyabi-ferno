const express = require('express');
const bcrypt = require('bcryptjs');
const { readSheet, appendRows, newId } = require('../storage/excelStorage');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
    }
    const users = await readSheet('Users');
    const user = users.find((u) => u.Username === username);
    if (!user) return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    if (String(user.Active) === 'false' || user.Active === false) {
      return res.status(403).json({ error: 'حساب کاربری شما غیرفعال شده است' });
    }
    const ok = await bcrypt.compare(password, user.Password_Hash);
    if (!ok) return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });

    const token = signToken(user);
    await appendRows('Audit_Log', {
      Log_ID: newId('log'),
      User_ID: user.User_ID,
      Username: user.Username,
      Action: 'LOGIN',
      Details: 'ورود موفق به سامانه',
      Created_At: new Date().toISOString(),
    });

    res.json({
      token,
      user: {
        id: user.User_ID,
        fullName: user.Full_Name,
        username: user.Username,
        role: user.Role,
        departments: (user.Departments || '').split(',').map((s) => s.trim()).filter(Boolean),
        forms: (user.Forms || '').split(',').map((s) => s.trim()).filter(Boolean),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطای سرور در ورود' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
