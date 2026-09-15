import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import EvaluatorDashboard from './pages/EvaluatorDashboard.jsx';
import NewEvaluation from './pages/NewEvaluation.jsx';
import MyEvaluations from './pages/MyEvaluations.jsx';
import BonusPage from './pages/BonusPage.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminEvaluations from './pages/AdminEvaluations.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminEmployees from './pages/AdminEmployees.jsx';
import AdminPeriods from './pages/AdminPeriods.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} /> : <Login />} />

      {/* مسیرهای Evaluator */}
      <Route path="/" element={<ProtectedRoute><EvaluatorDashboard /></ProtectedRoute>} />
      <Route path="/evaluate" element={<ProtectedRoute><NewEvaluation /></ProtectedRoute>} />
      <Route path="/my-evaluations" element={<ProtectedRoute><MyEvaluations /></ProtectedRoute>} />
      <Route path="/bonus" element={<ProtectedRoute><BonusPage /></ProtectedRoute>} />

      {/* مسیرهای Admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/evaluations" element={<ProtectedRoute adminOnly><AdminEvaluations /></ProtectedRoute>} />
      <Route path="/admin/export" element={<ProtectedRoute adminOnly><AdminEvaluations /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute adminOnly><AdminEmployees /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/periods" element={<ProtectedRoute adminOnly><AdminPeriods /></ProtectedRoute>} />
      <Route path="/admin/bonus" element={<ProtectedRoute adminOnly><BonusPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
