import { useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { setAuthToken } from './api';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import VehicleDetails from './components/VehicleDetails';
import CustomerMaster from './components/masters/CustomerMaster';
import VehicleMaster from './components/masters/VehicleMaster';

/* ── Error boundary — catches render errors so the whole app doesn't crash ── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#010408', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          maxWidth: 440, width: '100%', margin: '0 16px',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: 16, padding: '32px 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'rgba(252,165,165,0.9)' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(252,165,165,0.55)', lineHeight: 1.5 }}>
            An unexpected error occurred. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

/* ── Route guard ── */
function ProtectedLayout({ user, allowedRoles, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user'));
      // Set Authorization header synchronously — must happen before any child useEffect fires
      if (saved?.token) {
        setAuthToken(saved.token);
      }
      return saved;
    } catch {
      return null;
    }
  });

  function handleLogin(userData) {
    if (userData?.token) {
      setAuthToken(userData.token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function handleLogout() {
    localStorage.clear();
    setUser(null);
    setAuthToken(null);
  }

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              ) : (
                <LoginModal onLogin={handleLogin} />
              )
            }
          />

          <Route path="/admin" element={
            <ProtectedLayout user={user} allowedRoles={['admin']}>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          } />

          <Route path="/dashboard" element={
            <ProtectedLayout user={user} allowedRoles={['customer']}>
              <CustomerDashboard user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          } />

          <Route path="/vehicle/:id" element={
            <ProtectedLayout user={user}>
              <VehicleDetails user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          } />

          <Route path="/masters/customers" element={
            <ProtectedLayout user={user} allowedRoles={['admin']}>
              <CustomerMaster user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          } />

          <Route path="/masters/vehicles" element={
            <ProtectedLayout user={user} allowedRoles={['admin']}>
              <VehicleMaster user={user} onLogout={handleLogout} />
            </ProtectedLayout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
