require('dotenv').config();
const app = require('./app');
const { ensureDatabaseExists } = require('./storage/excelStorage');

const PORT = process.env.PORT || 4000;

ensureDatabaseExists().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ سرور ارزیابی عملکرد فرنو روی پورت ${PORT} در حال اجراست`);
    console.log(`   http://localhost:${PORT}/api/health`);
  });
});
