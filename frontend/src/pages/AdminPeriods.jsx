import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';

export default function AdminPeriods() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/periods').then((res) => setData(res.data));
  }, []);

  if (!data) return <Layout title="دوره‌های ارزیابی"><div className="loading-center"><div className="spinner" /></div></Layout>;

  const { current, history } = data;

  return (
    <Layout
      title="دوره‌های ارزیابی"
      subtitle="سال/ماه/هفته دیگر به‌صورت خودکار محاسبه می‌شود و نیازی به تعیین دستی توسط ادمین نیست"
    >
      <div className="card mb-4">
        <h3 style={{ marginTop: 0 }}>دوره فعلی (محاسبه خودکار)</h3>
        <div className="grid grid-4">
          <div className="stat-card"><div className="value">{current.Year}</div><div className="label">سال</div></div>
          <div className="stat-card"><div className="value">{current.Month}</div><div className="label">ماه</div></div>
          <div className="stat-card"><div className="value">{current.Week}</div><div className="label">هفته</div></div>
          <div className="stat-card">
            <div className="value" style={{ color: current.IsEvaluationDay ? 'var(--success)' : 'var(--warning)' }}>
              {current.WeekdayFa}
            </div>
            <div className="label">{current.IsEvaluationDay ? 'روز مجاز ارزیابی برای Evaluatorها' : 'روز غیرمجاز برای Evaluatorها'}</div>
          </div>
        </div>
        <div className="pill mt-3">
          روزهای مجاز ثبت ارزیابی برای مسئولان: <strong>{current.AllowedDaysLabel}</strong>
          &nbsp;— دسترسی ادمین همیشه و در همه روزها باز است.
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>تاریخچه دوره‌هایی که برایشان ارزیابی ثبت شده</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>سال</th><th>ماه</th><th>هفته</th><th>تعداد ارزیابی</th><th>وضعیت</th></tr></thead>
            <tbody>
              {history.map((p) => (
                <tr key={`${p.Year}-${p.Month}-${p.Week}`}>
                  <td>{p.Year}</td><td>{p.Month}</td><td>{p.Week}</td>
                  <td>{p.EvaluationCount}</td>
                  <td>{p.Is_Current ? <span className="badge badge-success">دوره جاری</span> : <span className="badge badge-info">آرشیو</span>}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={5} className="text-muted">هنوز هیچ ارزیابی‌ای ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
