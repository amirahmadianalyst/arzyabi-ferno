import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useToast } from '../ToastContext.jsx';

export default function AdminEmployees() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    client.get('/employees').then((res) => setEmployees(res.data));
  }
  useEffect(() => {
    load();
    client.get('/meta/departments').then((res) => { setDepartments(res.data); if (res.data[0]) setDept(res.data[0].id); });
  }, []);

  async function addEmployee(e) {
    e.preventDefault();
    if (!name || !dept) return;
    setSaving(true);
    try {
      await client.post('/employees', { Employee_Name: name, Department: dept });
      showToast('پرسنل جدید اضافه شد.');
      setName('');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ثبت پرسنل', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(emp) {
    const next = String(emp.Active) === 'true' ? 'false' : 'true';
    await client.patch(`/employees/${emp.Employee_ID}`, { Active: next });
    load();
  }

  const deptLabel = (id) => departments.find((d) => d.id === id)?.label || id;

  return (
    <Layout title="مدیریت پرسنل" subtitle="افزودن و مدیریت پرسنل هر بخش">
      <form className="card mb-4" onSubmit={addEmployee}>
        <div className="grid grid-3">
          <div className="field">
            <label>نام پرسنل</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>بخش</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'در حال ثبت...' : 'افزودن پرسنل'}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>نام پرسنل</th><th>بخش</th><th>وضعیت</th><th></th></tr></thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.Employee_ID}>
                  <td>{emp.Employee_Name}</td>
                  <td>{deptLabel(emp.Department)}</td>
                  <td><span className={`badge ${String(emp.Active) === 'true' ? 'badge-success' : 'badge-danger'}`}>{String(emp.Active) === 'true' ? 'فعال' : 'غیرفعال'}</span></td>
                  <td><button className="btn btn-sm" onClick={() => toggleActive(emp)}>{String(emp.Active) === 'true' ? 'غیرفعال کردن' : 'فعال کردن'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
