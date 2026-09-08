import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import PageBanner from '../../components/PageBanner';
import { formatDbDate } from '../../utils/dates';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/appointments'), api.get('/notifications')]).then(([a, n]) => {
      setAppointments(a.data.appointments || []);
      setNotifications(n.data.notifications || []);
    });
  }, []);

  const upcoming = appointments.filter((a) => ['pending', 'approved'].includes(a.status)).slice(0, 5);

  return (
    <div>
      <PageBanner
        image="/images/calm-counseling.jpg"
        title={`Hello, ${(user.full_name || 'there').split(' ')[0]}`}
        subtitle="Book sessions, chat privately, or join a video counseling appointment."
      >
        <Link className="btn btn-primary" to="/app/book">
          Book appointment
        </Link>
      </PageBanner>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total appointments</span>
          <strong>{appointments.length}</strong>
        </div>
        <div className="stat-card">
          <span>Upcoming</span>
          <strong>{upcoming.length}</strong>
        </div>
        <div className="stat-card">
          <span>Unread notices</span>
          <strong>{notifications.filter((n) => Number(n.is_read) === 0).length}</strong>
        </div>
      </div>

      <div className="dual">
        <div className="panel">
          <h3>Upcoming sessions</h3>
          {upcoming.length === 0 && <p className="muted">No upcoming appointments yet.</p>}
          <div className="stack">
            {upcoming.map((item) => (
              <div key={item.id} className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.counselor_name}</strong>
                  <div className="muted">
                    {formatDbDate(item.scheduled_at, 'EEE, MMM d · HH:mm')} · {item.mode}
                  </div>
                </div>
                <span className={`badge ${item.status}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Quick actions</h3>
          <div className="stack">
            <Link className="btn btn-secondary" to="/app/chat">
              Open secure chat
            </Link>
            <Link className="btn btn-secondary" to="/app/appointments">
              View all appointments
            </Link>
            <Link className="btn btn-secondary" to="/app/notifications">
              Check notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
