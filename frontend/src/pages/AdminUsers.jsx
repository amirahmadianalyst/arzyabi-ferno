import { useEffect, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import { useToast } from '../ToastContext.jsx';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ Full_Name: '', Username: '', Password: '', Role: 'EVALUATOR', Departments: [], Forms: [], Bonus_Departments: [] });

  function load() {
    client.get('/users').then((res) => setUsers(res.data));
  }

  useEffect(() => {
    load();
    client.get('/meta/departments').then((res) => setDepartments(res.data));
    client.get('/meta/forms').then((res) => setForms(res.data));
  }, []);

  function toggleMulti(field, value) {
    setForm((f) => {
      const has = f[field].includes(value);
      return { ...f, [field]: has ? f[field].filter((x) => x !== value) : [...f[field], value] };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/users', form);
      showToast('کاربر جدید با موفقیت ایجاد شد.');
      setShowForm(false);
      setForm({ Full_Name: '', Username: '', Password: '', Role: 'EVALUATOR', Departments: [], Forms: [], Bonus_Departments: [] });
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ایجاد کاربر', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    const nextActive = String(u.Active) === 'true' ? 'false' : 'true';
    await client.patch(`/users/${u.User_ID}`, { Active: nextActive });
    load();
  }

  return (
    <Layout
      title="مدیریت مسئولان"
      subtitle="ایجاد کاربر جدید و تعیین بخش‌ها/فرم‌های مجاز"
      right={<button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>{showForm ? 'بستن' : '+ مسئول جدید'}</button>}
    >
      {showForm && (
        <form className="card mb-4" onSubmit={submit}>
          <div className="grid grid-2">
            <div className="field">
              <label>نام و نام خانوادگی</label>
              <input value={form.Full_Name} onChange={(e) => setForm((f) => ({ ...f, Full_Name: e.target.value }))} required />
            </div>
            <div className="field">
              <label>نام کاربری</label>
              <input value={form.Username} onChange={(e) => setForm((f) => ({ ...f, Username: e.target.value }))} required />
            </div>
            <div className="field">
              <label>رمز عبور</label>
              <input type="password" value={form.Password} onChange={(e) => setForm((f) => ({ ...f, Password: e.target.value }))} required />
            </div>
            <div className="field">
              <label>نقش</label>
              <select value={form.Role} onChange={(e) => setForm((f) => ({ ...f, Role: e.target.value }))}>
                <option value="EVALUATOR">ارزیاب (Evaluator)</option>
                <option value="ADMIN">ادمین</option>
              </select>
            </div>
          </div>

          {form.Role === 'EVALUATOR' && (
            <>
              <div className="field">
                <label>بخش‌های مجاز</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {departments.map((d) => (
                    <label key={d.id} className="pill" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.Departments.includes(d.id)} onChange={() => toggleMulti('Departments', d.id)} />
                      {' '}{d.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>فرم‌های مجاز</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {forms.map((f) => (
                    <label key={f.id} className="pill" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.Forms.includes(f.id)} onChange={() => toggleMulti('Forms', f.id)} />
                      {' '}{f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>بخش‌های مجاز برای ثبت پاداش/جریمه</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {departments.map((d) => (
                    <label key={d.id} className="pill" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.Bonus_Departments.includes(d.id)} onChange={() => toggleMulti('Bonus_Departments', d.id)} />
                      {' '}{d.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ایجاد کاربر'}</button>
        </form>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>نام</th><th>نام کاربری</th><th>نقش</th><th>بخش‌ها</th><th>فرم‌ها</th><th>بخش‌های پاداش/جریمه</th><th>وضعیت</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.User_ID}>
                  <td>{u.Full_Name}</td>
                  <td>{u.Username}</td>
                  <td>{u.Role === 'ADMIN' ? 'ادمین' : 'ارزیاب'}</td>
                  <td>{u.Departments}</td>
                  <td>{u.Forms}</td>
                  <td>{u.Bonus_Departments}</td>
                  <td>
                    <span className={`badge ${String(u.Active) === 'true' ? 'badge-success' : 'badge-danger'}`}>
                      {String(u.Active) === 'true' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td><button className="btn btn-sm" onClick={() => toggleActive(u)}>
                    {String(u.Active) === 'true' ? 'غیرفعال کردن' : 'فعال کردن'}
                  </button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
