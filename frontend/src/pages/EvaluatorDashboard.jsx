import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../AuthContext.jsx';

export default function EvaluatorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/dashboard/evaluator').then((res) => setData(res.data));
  }, []);

  if (!data) return <Layout title="داشبورد"><div className="loading-center"><div className="spinner" /></div></Layout>;

  const { activePeriod, completed, remaining, completionRate, recentEvaluations } = data;

  return (
    <Layout
      title={`سلام، ${user.fullName} 👋`}
      subtitle={`دوره فعال: ${activePeriod.Year} / ${activePeriod.Month} / هفته ${activePeriod.Week} — امروز ${activePeriod.WeekdayFa}`}
      right={<button className="btn btn-primary" onClick={() => navigate('/evaluate')}>+ ارزیابی جدید</button>}
    >
      {!activePeriod.IsEvaluationDay && (
        <div className="card mb-4" style={{ borderColor: 'var(--warning)' }}>
          <strong style={{ color: 'var(--warning)' }}>⏳ امروز روز مجاز ثبت ارزیابی نیست.</strong>
          <div className="text-muted mt-2">
            روزهای مجاز برای ثبت ارزیابی <strong>{activePeriod.AllowedDaysLabel}</strong> است.
            می‌توانید ارزیابی‌های قبلی خود را از «ارزیابی‌های من» مشاهده یا ویرایش کنید.
          </div>
        </div>
      )}

      <div className="grid grid-3 mb-4">
        <div className="card stat-card">
          <div className="value">{completed}</div>
          <div className="label">ارزیابی‌های تکمیل‌شده</div>
        </div>
        <div className="card stat-card">
          <div className="value">{remaining}</div>
          <div className="label">ارزیابی‌های باقی‌مانده</div>
        </div>
        <div className="card stat-card">
          <div className="value">{completionRate}٪</div>
          <div className="label">درصد تکمیل</div>
          <div className="progress-bar mt-2"><div style={{ width: `${completionRate}%` }} /></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>آخرین ارزیابی‌های ثبت‌شده</h3>
        {recentEvaluations.length === 0 && <div className="text-muted">هنوز ارزیابی‌ای ثبت نکرده‌اید.</div>}
        {recentEvaluations.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>پرسنل</th><th>بخش</th><th>میانگین امتیاز</th><th>تاریخ ثبت</th></tr>
              </thead>
              <tbody>
                {recentEvaluations.map((e) => (
                  <tr key={e.Evaluation_ID}>
                    <td>{e.Employee_Name}</td>
                    <td>{e.Department}</td>
                    <td>{e.Average_Score}</td>
                    <td>{new Date(e.Created_At).toLocaleDateString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-2 mt-4">
        {user.departments.map((d) => (
          <div key={d} className="card">
            <strong>بخش مجاز:</strong> {d}
          </div>
        ))}
      </div>
    </Layout>
  );
}
