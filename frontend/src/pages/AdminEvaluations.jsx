import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

export default function AdminEvaluations() {
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  const [filters, setFilters] = useState({ year: '', month: '', week: '', department: '', formId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/meta/departments').then((res) => setDepartments(res.data));
    client.get('/meta/forms').then((res) => setForms(res.data));
  }, []);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    client.get('/evaluations', { params }).then((res) => { setList(res.data); setLoading(false); });
  }

  useEffect(() => { load(); }, [filters]);

  function exportUrl(kind) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const token = localStorage.getItem('ferno_token');
    return `/api/export/${kind}?${params.toString()}&_t=${token}`;
  }

  async function downloadExport(kind) {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await client.get(`/export/${kind}`, { params, responseType: 'blob' });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'csv' ? 'ferno_export.csv' : `ferno_export_${kind}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <Layout
      title="مدیریت ارزیابی‌ها"
      subtitle="مشاهده و فیلتر تمام ارزیابی‌های ثبت‌شده در سامانه"
      right={
        <div className="flex gap-2">
          <button className="btn" onClick={() => downloadExport('raw')}>خروجی خام</button>
          <button className="btn" onClick={() => downloadExport('management')}>خروجی مدیریتی</button>
          <button className="btn" onClick={() => downloadExport('csv')}>CSV</button>
        </div>
      }
    >
      <div className="filters-bar">
        <input placeholder="سال" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} />
        <select value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
          <option value="">همه ماه‌ها</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input placeholder="هفته" value={filters.week} onChange={(e) => setFilters((f) => ({ ...f, week: e.target.value }))} />
        <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
          <option value="">همه بخش‌ها</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <select value={filters.formId} onChange={(e) => setFilters((f) => ({ ...f, formId: e.target.value }))}>
          <option value="">همه فرم‌ها</option>
          {forms.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      <div className="card">
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>پرسنل</th><th>بخش</th><th>ارزیاب</th><th>فرم</th><th>دوره</th><th>میانگین</th><th>وضعیت</th><th>تاریخ ثبت</th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.Evaluation_ID}>
                    <td>{e.Employee_Name}</td>
                    <td>{e.Department}</td>
                    <td>{e.Evaluator_Name}</td>
                    <td>{e.Form_ID}</td>
                    <td>{e.Year}/{e.Month}/ه{e.Week}</td>
                    <td>{e.Average_Score}</td>
                    <td><span className="badge badge-success">{e.Status === 'SUBMITTED' ? 'ثبت‌شده' : e.Status}</span></td>
                    <td>{new Date(e.Created_At).toLocaleDateString('fa-IR')}</td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={8} className="text-muted">موردی یافت نشد.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
