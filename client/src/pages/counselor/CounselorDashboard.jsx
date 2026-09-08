import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import PageBanner from '../../components/PageBanner';

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/appointments'), api.get('/clients')]).then(([a, c]) => {
      setAppointments(a.data.appointments || []);
      setClients(c.data.clients || []);
    });
  }, []);

  const pending = appointments.filter((a) => a.status === 'pending');
  const todayish = appointments.filter((a) => ['approved', 'pending'].includes(a.status)).slice(0, 6);

  return (
    <div>
      <PageBanner
        image="/images/calm-counseling.jpg"
        title="Counselor workspace"
        subtitle={`Welcome, ${user.full_name}. Manage requests, clients, and session notes.`}
      >
        <Link className="btn btn-primary" to="/app/clients">
          Open client list
        </Link>
        <Link className="btn btn-secondary" to="/app/reports">
          Generate reports
        </Link>
      </PageBanner>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Pending requests</span>
          <strong>{pending.length}</strong>
        </div>
        <div className="stat-card">
          <span>Assigned clients</span>
          <strong>{clients.filter((c) => Number(c.counselor_id) === Number(user.id)).length}</strong>
        </div>
        <div className="stat-card">
          <span>All appointments</span>
          <strong>{appointments.length}</strong>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>Queue</h3>
        <div className="stack">
          {todayish.length === 0 && <p className="muted">No appointments in your queue.</p>}
          {todayish.map((item) => (
            <div key={item.id} className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{item.student_name}</strong>
                <div className="muted">
                  {format(new Date(item.scheduled_at), 'PPp')} · {item.mode}
                </div>
              </div>
              <span className={`badge ${item.status}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
