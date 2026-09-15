import Sidebar from './Sidebar.jsx';

export default function Layout({ title, subtitle, right, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {(title || right) && (
          <div className="topbar">
            <div>
              {title && <h1>{title}</h1>}
              {subtitle && <div className="subtitle">{subtitle}</div>}
            </div>
            {right}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
