import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useToast } from '../ToastContext.jsx';

export default function BonusPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [date, setDate] = useState('');
  const [items, setItems] = useState({});
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/meta/bonus-roles').then((res) => setRoles(res.data));
  }, []);

  function pickRole(r) {
    setSelectedRole(r);
    setItems({});
    loadRecords(r.id);
  }

  function loadRecords(roleId) {
    client.get('/bonus', { params: { role: roleId } }).then((res) => setRecords(res.data));
  }

  const estimatedFinal = selectedRole
    ? Math.max(0, selectedRole.baseAmount - selectedRole.items.reduce((s, it) => s + (Number(items[it.key]) || 0) * it.unitPenalty, 0))
    : 0;

  async function submit(e) {
    e.preventDefault();
    if (!employeeName || !date) return showToast('نام پرسنل و تاریخ الزامی است', 'error');
    setSaving(true);
    try {
      await client.post('/bonus', { Bonus_Role: selectedRole.id, Employee_Name: employeeName, Date: date, Items: items });
      showToast('رکورد پاداش/جریمه ثبت شد.');
      setEmployeeName(''); setDate(''); setItems({});
      loadRecords(selectedRole.id);
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ثبت', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="ثبت پاداش / جریمه" subtitle="منطق این بخش مستقل از ارزیابی‌های معمولی است (کسر جریمه از مبلغ پایه روزانه)">
      {!selectedRole && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>انتخاب نقش پاداش</h3>
          <div className="dept-grid">
            {roles.map((r) => (
              <div key={r.id} className="dept-tile" onClick={() => pickRole(r)}>{r.label}</div>
            ))}
          </div>
        </div>
      )}

      {selectedRole && (
        <>
          <div className="flex-between mb-3">
            <h3 style={{ margin: 0 }}>{selectedRole.label} — مبلغ پایه: {selectedRole.baseAmount.toLocaleString('fa-IR')} تومان</h3>
            <button className="btn btn-sm" onClick={() => setSelectedRole(null)}>بازگشت</button>
          </div>

          <form className="card mb-4" onSubmit={submit}>
            <div className="grid grid-2">
              <div className="field">
                <label>نام پرسنل</label>
                <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required />
              </div>
              <div className="field">
                <label>تاریخ</label>
                <input placeholder="1404/08/01" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>

            {selectedRole.items.map((it) => (
              <div key={it.key} className="field">
                <label>{it.label} (کسر {it.unitPenalty.toLocaleString('fa-IR')} به ازای هر واحد)</label>
                <input type="number" min="0" value={items[it.key] || ''} onChange={(e) => setItems((s) => ({ ...s, [it.key]: e.target.value }))} />
              </div>
            ))}

            <div className="pill mb-3">مبلغ نهایی برآوردی: <strong>{estimatedFinal.toLocaleString('fa-IR')} تومان</strong></div>
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'در حال ثبت...' : 'ثبت رکورد'}</button>
          </form>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>رکوردهای اخیر</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>نام</th><th>تاریخ</th><th>مبلغ نهایی</th><th>ثبت‌کننده</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.Bonus_ID}>
                      <td>{r.Employee_Name}</td><td>{r.Date}</td>
                      <td>{Number(r.Final_Amount).toLocaleString('fa-IR')} تومان</td>
                      <td>{r.Recorded_By}</td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={4} className="text-muted">رکوردی ثبت نشده است.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
