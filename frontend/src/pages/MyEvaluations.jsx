import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import ScoreButtons from '../components/ScoreButtons.jsx';
import { useToast } from '../ToastContext.jsx';

export default function MyEvaluations() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    client.get('/evaluations').then((res) => { setList(res.data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function startEdit(ev) {
    setEditing(ev);
    setNotes(ev.Notes || '');
    const res = await client.get(`/meta/forms/${ev.Form_ID}/${ev.Department}`);
    setCriteria(res.data.criteria);
    const scoreRes = await client.get('/evaluations', { params: { employeeId: ev.Employee_ID, formId: ev.Form_ID, year: ev.Year, month: ev.Month, week: ev.Week } });
    setScores({});
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await client.patch(`/evaluations/${editing.Evaluation_ID}`, { Scores: scores, Notes: notes });
      showToast('ارزیابی با موفقیت به‌روزرسانی شد.');
      setEditing(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ویرایش', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="ارزیابی‌های من" subtitle="فهرست ارزیابی‌هایی که شما ثبت کرده‌اید">
      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {!loading && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>پرسنل</th><th>بخش</th><th>فرم</th><th>دوره</th><th>میانگین</th><th>وضعیت</th><th>تاریخ</th><th></th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.Evaluation_ID}>
                    <td>{e.Employee_Name}</td>
                    <td>{e.Department}</td>
                    <td>{e.Form_ID}</td>
                    <td>{e.Year}/{e.Month}/ه{e.Week}</td>
                    <td>{e.Average_Score}</td>
                    <td><span className="badge badge-success">{e.Status === 'SUBMITTED' ? 'ثبت‌شده' : e.Status}</span></td>
                    <td>{new Date(e.Created_At).toLocaleDateString('fa-IR')}</td>
                    <td><button className="btn btn-sm" onClick={() => startEdit(e)}>ویرایش</button></td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={8} className="text-muted">هنوز ارزیابی‌ای ثبت نکرده‌اید.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>ویرایش ارزیابی — {editing.Employee_Name}</h3>
            <div className="text-muted mb-3">نمرات جدید را وارد کنید؛ نمرات قبلی در تاریخچه حفظ می‌شوند.</div>
            {criteria.map((c) => (
              <div key={c.key} className="score-row">
                <div className="criterion-label">{c.label}</div>
                <ScoreButtons scale={c.scale} value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
              </div>
            ))}
            <div className="field mt-3">
              <label>توضیحات</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditing(null)}>انصراف</button>
              <button className="btn btn-primary btn-block" disabled={saving} onClick={saveEdit}>
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
