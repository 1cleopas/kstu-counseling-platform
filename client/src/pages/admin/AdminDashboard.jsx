import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div>Loading admin dashboard...</div>;

  const { stats, recentAppointments, appointmentsByStatus } = data;

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="Administration"
        subtitle="Monitor counseling utilisation, staffing visibility, and platform activity."
      />

      <div className="stats-grid">
        <div className="stat-card"><span>Students</span><strong>{stats.students}</strong></div>
        <div className="stat-card"><span>Counselors</span><strong>{stats.counselors}</strong></div>
        <div className="stat-card"><span>Appointments</span><strong>{stats.appointments}</strong></div>
        <div className="stat-card"><span>Pending</span><strong>{stats.pending}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{stats.completed}</strong></div>
        <div className="stat-card"><span>Session notes</span><strong>{stats.sessions}</strong></div>
        <div className="stat-card"><span>Messages</span><strong>{stats.messages}</strong></div>
        <div className="stat-card"><span>Active clients</span><strong>{stats.activeClients}</strong></div>
      </div>

      <div className="dual">
        <div className="panel">
          <h3>Recent appointments</h3>
          <div className="stack">
            {recentAppointments.map((item) => (
              <div key={item.id} className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.student_name}</strong>
                  <div className="muted">
                    with {item.counselor_name} · {format(new Date(item.scheduled_at), 'PPp')}
                  </div>
                </div>
                <span className={`badge ${item.status}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Appointments by status</h3>
          <div className="stack">
            {appointmentsByStatus.map((row) => (
              <div key={row.status} className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <span className={`badge ${row.status}`}>{row.status}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
