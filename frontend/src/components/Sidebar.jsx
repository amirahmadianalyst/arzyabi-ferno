import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const ADMIN_LINKS = [
  { to: '/admin', label: 'داشبورد', end: true },
  { to: '/admin/evaluations', label: 'ارزیابی‌ها' },
  { to: '/admin/employees', label: 'پرسنل' },
  { to: '/admin/users', label: 'مسئولان' },
  { to: '/admin/periods', label: 'سال / ماه / هفته' },
  { to: '/admin/bonus', label: 'پاداش / جریمه' },
  { to: '/admin/export', label: 'دانلود Excel' },
];

const EVALUATOR_LINKS = [
  { to: '/', label: 'داشبورد', end: true },
  { to: '/evaluate', label: 'ارزیابی جدید' },
  { to: '/my-evaluations', label: 'ارزیابی‌های من' },
  { to: '/bonus', label: 'ثبت پاداش/جریمه' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? ADMIN_LINKS : EVALUATOR_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        فرنو
        <small>سامانه ارزیابی عملکرد پرسنل</small>
      </div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          {l.label}
        </NavLink>
      ))}
      <div className="sidebar-footer">
        <div className="nav-item" onClick={() => { logout(); navigate('/login'); }}>
          خروج
        </div>
      </div>
    </aside>
  );
}
