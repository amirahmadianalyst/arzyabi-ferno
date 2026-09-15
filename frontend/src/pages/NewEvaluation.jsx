import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import Layout from '../components/Layout.jsx';
import ScoreButtons from '../components/ScoreButtons.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

const STEPS = ['بخش', 'فرم', 'پرسنل', 'امتیازدهی', 'ثبت'];

export default function NewEvaluation() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [activePeriod, setActivePeriod] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/periods/active').then((res) => setActivePeriod(res.data));
    client.get('/meta/departments').then((res) => setDepartments(res.data));
    client.get('/meta/forms').then((res) => setForms(res.data));
  }, []);

  const availableFormsForDept = useMemo(
    () => forms.filter((f) => selectedDept && f.departments.includes(selectedDept)),
    [forms, selectedDept]
  );

  function pickDepartment(deptId) {
    setSelectedDept(deptId);
    const availForms = forms.filter((f) => f.departments.includes(deptId));
    if (availForms.length === 1) {
      pickForm(availForms[0].id, deptId);
    } else {
      setStep(1);
    }
  }

  function pickForm(formId, deptOverride) {
    const dept = deptOverride || selectedDept;
    setSelectedForm(formId);
    client.get(`/employees?department=${dept}`).then((res) => setEmployees(res.data));
    setStep(2);
  }

  async function pickEmployee(emp) {
    setSelectedEmployee(emp);
    setDuplicateInfo(null);
    try {
      const dup = await client.get('/evaluations/check-duplicate', {
        params: {
          employeeId: emp.Employee_ID, formId: selectedForm,
          year: activePeriod.Year, month: activePeriod.Month, week: activePeriod.Week,
        },
      });
      if (dup.data.duplicate) {
        setDuplicateInfo(dup.data.evaluation);
        return;
      }
    } catch { /* ignore */ }

    const critRes = await client.get(`/meta/forms/${selectedForm}/${selectedDept}`);
    setCriteria(critRes.data.criteria);
    setScores({});
    setNotes('');
    setStep(3);
  }

  const allScored = criteria.length > 0 && criteria.every((c) => scores[c.key]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await client.post('/evaluations', {
        Employee_ID: selectedEmployee.Employee_ID,
        Employee_Name: selectedEmployee.Employee_Name,
        Department: selectedDept,
        Form_ID: selectedForm,
        Year: activePeriod.Year, Month: activePeriod.Month, Week: activePeriod.Week,
        Notes: notes,
        Scores: scores,
      });
      showToast('ارزیابی با موفقیت ثبت شد.');
      setConfirmOpen(false);
      // بازگشت به انتخاب پرسنل برای ادامه سریع ارزیابی‌های بعدی
      setSelectedEmployee(null);
      setScores({});
      setNotes('');
      setStep(2);
      client.get(`/employees?department=${selectedDept}`).then((res) => setEmployees(res.data));
    } catch (err) {
      showToast(err.response?.data?.error || 'خطا در ثبت ارزیابی', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!activePeriod) {
    return (
      <Layout title="ارزیابی جدید">
        <div className="card">دوره فعالی توسط ادمین تعیین نشده است. لطفاً با مدیر سامانه تماس بگیرید.</div>
      </Layout>
    );
  }

  const formLabel = forms.find((f) => f.id === selectedForm)?.label;
  const deptLabel = departments.find((d) => d.id === selectedDept)?.label;

  return (
    <Layout
      title="ارزیابی جدید"
      subtitle={`دوره فعال: ${activePeriod.Year} / ${activePeriod.Month} / هفته ${activePeriod.Week}`}
    >
      <div className="steps-bar">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-chip ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>انتخاب بخش</h3>
          <div className="dept-grid">
            {departments.map((d) => (
              <div key={d.id} className="dept-tile" onClick={() => pickDepartment(d.id)}>
                {d.label}
              </div>
            ))}
          </div>
          {departments.length === 0 && <div className="text-muted">هیچ بخشی برای شما تعریف نشده است.</div>}
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <div className="flex-between mb-3">
            <h3 style={{ margin: 0 }}>انتخاب فرم ارزیابی — بخش: {deptLabel}</h3>
            <button className="btn btn-sm" onClick={() => setStep(0)}>بازگشت</button>
          </div>
          <div className="dept-grid">
            {availableFormsForDept.map((f) => (
              <div key={f.id} className="dept-tile" onClick={() => pickForm(f.id)}>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="flex-between mb-3">
            <h3 style={{ margin: 0 }}>انتخاب پرسنل — {deptLabel} / {formLabel}</h3>
            <button className="btn btn-sm" onClick={() => setStep(availableFormsForDept.length > 1 ? 1 : 0)}>بازگشت</button>
          </div>
          <div className="employee-grid">
            {employees.map((emp) => (
              <div
                key={emp.Employee_ID}
                className={`employee-tile ${selectedEmployee?.Employee_ID === emp.Employee_ID ? 'selected' : ''}`}
                onClick={() => pickEmployee(emp)}
              >
                {emp.Employee_Name}
              </div>
            ))}
            {employees.length === 0 && <div className="text-muted">پرسنلی برای این بخش ثبت نشده است.</div>}
          </div>
          {duplicateInfo && (
            <div className="login-error mt-3">
              برای این پرسنل در این دوره قبلاً ارزیابی ثبت شده است (امتیاز: {duplicateInfo.Average_Score}).
              برای ویرایش به «ارزیابی‌های من» مراجعه کنید.
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <div className="flex-between mb-3">
            <h3 style={{ margin: 0 }}>امتیازدهی — {selectedEmployee?.Employee_Name}</h3>
            <button className="btn btn-sm" onClick={() => setStep(2)}>بازگشت</button>
          </div>
          {criteria.map((c) => (
            <div key={c.key} className="score-row">
              <div className="criterion-label">{c.label}</div>
              <ScoreButtons
                scale={c.scale}
                value={scores[c.key]}
                onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
              />
            </div>
          ))}

          <div className="field mt-3">
            <label>توضیحات ارزیاب</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات اختیاری..." />
          </div>

          <button className="btn btn-primary btn-block" disabled={!allScored} onClick={() => setConfirmOpen(true)}>
            ثبت ارزیابی
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="تایید ثبت ارزیابی"
        message="آیا از صحت نمرات وارد شده اطمینان دارید؟"
        confirmLabel={submitting ? 'در حال ثبت...' : 'ثبت نهایی'}
        onConfirm={handleSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}
