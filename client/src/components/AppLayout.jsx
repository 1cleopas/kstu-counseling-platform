import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/app', label: 'Dashboard', end: true },
    ...(user.role === 'student'
      ? [
          { to: '/app/book', label: 'Book Appointment' },
          { to: '/app/appointments', label: 'My Appointments' }
        ]
      : []),
    ...(user.role === 'counselor' || user.role === 'admin'
      ? [
          { to: '/app/clients', label: 'Clients' },
          { to: '/app/counselor-appointments', label: 'Appointments' },
          { to: '/app/reports', label: 'Reports' }
        ]
      : []),
    ...(user.role === 'admin' ? [{ to: '/app/admin/users', label: 'Users' }] : []),
    { to: '/app/chat', label: 'Chat' },
    { to: '/app/notifications', label: 'Notifications' }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar anim-slide-left">
        <div className="brand">
          <div className="brand-badge pulse-soft">K</div>
          <div>
            <p className="brand-mark">KSTU Care</p>
            <small>Counseling Platform</small>
          </div>
        </div>
        <nav className="side-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="app-topbar anim-fade-down">
          <div>
            <strong>{user.full_name}</strong>
            <div className="muted role-chip">{user.role} · {user.email}</div>
          </div>
          <div className="auth-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="content page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
