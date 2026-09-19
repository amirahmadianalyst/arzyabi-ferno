const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ferno-dev-secret-change-in-production';

function signToken(user) {
  return jwt.sign(
    {
      id: user.User_ID,
      username: user.Username,
      role: user.Role,
      fullName: user.Full_Name,
      departments: safeParseList(user.Departments),
      forms: safeParseList(user.Forms),
      bonusDepartments: safeParseList(user.Bonus_Departments),
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function safeParseList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return String(val).split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'ورود مورد نیاز است' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'نشست شما نامعتبر یا منقضی شده است' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'دسترسی غیرمجاز - فقط ادمین' });
  }
  next();
}

// بررسی می‌کند که کاربر (Evaluator) اجازه دسترسی به این بخش را دارد یا نه
function requireDepartmentAccess(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  const dept = req.params.department || req.body.Department || req.query.department;
  if (!dept) return next();
  if (!req.user.departments.includes(dept)) {
    return res.status(403).json({ error: 'شما به این بخش دسترسی ندارید' });
  }
  next();
}

// بررسی می‌کند که کاربر (Evaluator) اجازه استفاده از این فرم را دارد یا نه
function requireFormAccess(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  const formId = req.params.formId || req.body.Form_ID || req.query.formId;
  if (!formId) return next();
  if (!req.user.forms.includes(formId)) {
    return res.status(403).json({ error: 'شما به این فرم ارزیابی دسترسی ندارید' });
  }
  next();
}

module.exports = { signToken, requireAuth, requireAdmin, requireDepartmentAccess, requireFormAccess, JWT_SECRET };
