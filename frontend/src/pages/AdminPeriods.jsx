import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useToast } from '../ToastContext.jsx';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

export default function AdminPeriods() {
  const { showToast } = useToast();
  const [periods, setPeriods] = useState([]);
  const [year, setYear] = useState(1405);
  const [month, setMonth] = useState('شهریور');
  const [week, setWeek] = useState(1);
  const [saving, setSaving] = useState(false);

  function load() {
    client.get('/periods').then((res) => setPeriods(res.data));
  }
  useEffect(() => { load(); }, []);

  async function setActive(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/periods', { Year: year, Month: month, Week: week });
      showToast('دوره فعال با موفقیت تغییر کرد.');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در تعیین دوره', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="مدیریت سال / ماه / هفته" subtitle="تعیین دوره فعال برای تمام مسئولان">
      <form className="card mb-4" onSubmit={setActive}>
        <div className="grid grid-3">
          <div className="field">
            <label>سال</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="field">
            <label>ماه</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label>هفته</label>
            <select value={week} onChange={(e) => setWeek(e.target.value)}>
              {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w}>هفته {w}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'در حال ثبت...' : 'تعیین به‌عنوان دوره فعال'}</button>
      </form>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>تاریخچه دوره‌ها</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>سال</th><th>ماه</th><th>هفته</th><th>وضعیت</th><th>تاریخ ایجاد</th></tr></thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.Period_ID}>
                  <td>{p.Year}</td><td>{p.Month}</td><td>{p.Week}</td>
                  <td>{String(p.Is_Active) === 'true' ? <span className="badge badge-success">فعال</span> : <span className="badge badge-info">آرشیو</span>}</td>
                  <td>{new Date(p.Created_At).toLocaleDateString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
