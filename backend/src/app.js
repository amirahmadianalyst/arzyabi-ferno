const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const metaRoutes = require('./routes/meta');
const periodsRoutes = require('./routes/periods');
const employeesRoutes = require('./routes/employees');
const evaluationsRoutes = require('./routes/evaluations');
const usersRoutes = require('./routes/users');
const bonusRoutes = require('./routes/bonus');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ferno-evaluation-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/periods', periodsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bonus', bonusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

app.use((req, res) => res.status(404).json({ error: 'مسیر یافت نشد' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای داخلی سرور' });
});

module.exports = app;
