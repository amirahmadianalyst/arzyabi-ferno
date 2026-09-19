import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

export default function BonusPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [unitAmount, setUnitAmount] = useState(5000);
  const [selectedDept, setSelectedDept] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [type, setType] = useState(null); // 'BONUS' | 'PENALTY'
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/meta/bonus-departments').then((res) => {
      setDepartments(res.data.departments);
      setUnitAmount(res.data.unitAmount);
    });
  }, []);

  function pickDepartment(dept) {
    setSelectedDept(dept);
    setSelectedEmployee(null);
    client.get(`/employees?department=${dept.id}`).then((res) => setEmployees(res.data));
    loadRecords(dept.id);
  }

  function loadRecords(deptId) {
    client.get('/bonus', { params: { department: deptId } }).then((res) => setRecords(res.data));
  }

  function pickEmployee(emp) {
    setSelectedEmployee(emp);
    setType(null);
    setScore('');
    setNotes('');
  }

  const amount = (Number(score) || 0) * unitAmount;

  async function submit(e) {
    e.preventDefault();
    if (!type) return showToast('نوع رکورد (پاداش یا جریمه) را انتخاب کنید', 'error');
    if (!score || Number(score) <= 0) return showToast('امتیاز باید عددی مثبت باشد', 'error');
    setSaving(true);
    try {
      await client.post('/bonus', {
        Department: selectedDept.id,
        Employee_ID: selectedEmployee.Employee_ID,
        Employee_Name: selectedEmployee.Employee_Name,
        Type: type,
        Score: score,
        Notes: notes,
      });
      showToast('رکورد با موفقیت ثبت شد.');
      setSelectedEmployee(null);
      setType(null);
      setScore('');
      setNotes('');
      loadRecords(selectedDept.id);
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ثبت', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title="پاداش / جریمه"
      subtitle={`هر امتیاز معادل ${unitAmount.toLocaleString('fa-IR')} تومان است`}
      right={user.role === 'ADMIN' && selectedDept ? (
        <button className="btn" onClick={() => downloadExport(selectedDept.id)}>دانلود Excel این بخش</button>
      ) : undefined}
    >
      {!selectedDept && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>انتخاب بخش</h3>
          {departments.length === 0 && (
            <div className="text-muted">هیچ بخشی برای ثبت پاداش/جریمه به شما اختصاص داده نشده است. با ادمین تماس بگیرید.</div>
          )}
          <div className="dept-grid">
            {departments.map((d) => (
              <div key={d.id} className="dept-tile" onClick={() => pickDepartment(d)}>{d.label}</div>
            ))}
          </div>
        </div>
      )}

      {selectedDept && (
        <>
          <div className="flex-between mb-3">
            <h3 style={{ margin: 0 }}>بخش: {selectedDept.label}</h3>
            <button className="btn btn-sm" onClick={() => setSelectedDept(null)}>بازگشت</button>
          </div>

          {!selectedEmployee && (
            <div className="card mb-4">
              <h3 style={{ marginTop: 0 }}>انتخاب پرسنل</h3>
              <div className="employee-grid">
                {employees.map((emp) => (
                  <div key={emp.Employee_ID} className="employee-tile" onClick={() => pickEmployee(emp)}>
                    {emp.Employee_Name}
                  </div>
                ))}
                {employees.length === 0 && <div className="text-muted">پرسنلی در این بخش ثبت نشده است.</div>}
              </div>
            </div>
          )}

          {selectedEmployee && (
            <form className="card mb-4" onSubmit={submit}>
              <div className="flex-between mb-3">
                <h3 style={{ margin: 0 }}>{selectedEmployee.Employee_Name}</h3>
                <button type="button" className="btn btn-sm" onClick={() => setSelectedEmployee(null)}>تغییر پرسنل</button>
              </div>

              <div className="field">
                <label>نوع رکورد</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn ${type === 'BONUS' ? 'btn-primary' : ''}`}
                    style={type === 'BONUS' ? {} : { borderColor: 'var(--success)', color: 'var(--success)' }}
                    onClick={() => setType('BONUS')}
                  >
                    پاداش
                  </button>
                  <button
                    type="button"
                    className={`btn ${type === 'PENALTY' ? 'btn-danger' : ''}`}
                    style={type === 'PENALTY' ? {} : { borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    onClick={() => setType('PENALTY')}
                  >
                    جریمه
                  </button>
                </div>
              </div>

              <div className="field">
                <label>امتیاز</label>
                <input type="number" min="1" step="1" value={score} onChange={(e) => setScore(e.target.value)} required />
              </div>

              <div className="field">
                <label>توضیحات</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="pill mb-3">
                مبلغ محاسبه‌شده: <strong>{amount.toLocaleString('fa-IR')} تومان</strong>
                {type && <span> ({type === 'BONUS' ? 'پاداش' : 'جریمه'})</span>}
              </div>

              <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'در حال ثبت...' : 'ثبت رکورد'}</button>
            </form>
          )}

          <div className="card">
            <div className="flex-between mb-3">
              <h3 style={{ margin: 0 }}>رکوردهای این بخش</h3>
              {user.role === 'ADMIN' && (
                <button className="btn btn-sm" onClick={() => downloadExport(selectedDept.id)}>دانلود Excel</button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>تاریخ</th><th>پرسنل</th><th>نوع</th><th>امتیاز</th><th>مبلغ</th><th>ارزیاب</th><th>توضیحات</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.Bonus_ID}>
                      <td>{r.Date}</td>
                      <td>{r.Employee_Name}</td>
                      <td><span className={`badge ${r.Type === 'BONUS' ? 'badge-success' : 'badge-danger'}`}>{r.Type === 'BONUS' ? 'پاداش' : 'جریمه'}</span></td>
                      <td>{r.Score}</td>
                      <td>{Number(r.Amount).toLocaleString('fa-IR')} تومان</td>
                      <td>{r.Evaluator_Name}</td>
                      <td>{r.Notes}</td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={7} className="text-muted">رکوردی ثبت نشده است.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );

  async function downloadExport(deptId) {
    const res = await client.get('/bonus/export', { params: { department: deptId }, responseType: 'blob' });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ferno_bonus_export.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
