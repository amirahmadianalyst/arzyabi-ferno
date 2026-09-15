import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/dashboard/admin').then((res) => setData(res.data));
  }, []);

  if (!data) return <Layout title="داشبورد ادمین"><div className="loading-center"><div className="spinner" /></div></Layout>;

  const { activePeriod, totalEmployees, totalEvaluators, totalEvaluations, periodEvaluations, averageScore, departmentStats } = data;

  return (
    <Layout
      title="داشبورد مدیریت"
      subtitle={activePeriod ? `دوره فعال: ${activePeriod.Year} / ${activePeriod.Month} / هفته ${activePeriod.Week}` : 'دوره فعالی تعیین نشده است'}
    >
      <div className="grid grid-4 mb-4">
        <div className="card stat-card"><div className="value">{totalEmployees}</div><div className="label">تعداد کل پرسنل</div></div>
        <div className="card stat-card"><div className="value">{totalEvaluators}</div><div className="label">تعداد مسئولان</div></div>
        <div className="card stat-card"><div className="value">{totalEvaluations}</div><div className="label">تعداد کل ارزیابی‌ها</div></div>
        <div className="card stat-card"><div className="value">{periodEvaluations}</div><div className="label">ارزیابی‌های دوره فعال</div></div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card stat-card">
          <div className="value">{averageScore}</div>
          <div className="label">میانگین امتیازها (دوره فعال)</div>
        </div>
        <div className="card">
          <div className="flex-between">
            <strong>وضعیت دوره فعال</strong>
          </div>
          {activePeriod ? (
            <div className="mt-2">{activePeriod.Year} / {activePeriod.Month} / هفته {activePeriod.Week}</div>
          ) : (
            <div className="text-muted mt-2">دوره فعالی تعیین نشده — از منوی «سال / ماه / هفته» تعیین کنید.</div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>وضعیت هر بخش (دوره فعال)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>بخش</th><th>تعداد پرسنل</th><th>تعداد ارزیابی ثبت‌شده</th><th>میانگین امتیاز</th></tr>
            </thead>
            <tbody>
              {departmentStats.map((d) => (
                <tr key={d.department}>
                  <td>{d.label}</td>
                  <td>{d.employeeCount}</td>
                  <td>{d.evaluationCount}</td>
                  <td>{d.averageScore || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
