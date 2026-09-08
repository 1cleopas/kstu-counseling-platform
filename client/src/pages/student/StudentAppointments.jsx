import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';
import { formatDbDate } from '../../utils/dates';

export default function StudentAppointments() {
  const [appointments, setAppointments] = useState([]);

  async function load() {
    const { data } = await api.get('/appointments');
    setAppointments(data.appointments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
    load();
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="My appointments"
        subtitle="Track request status and join approved online sessions."
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Counselor</th>
              <th>When</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">No appointments yet.</td>
              </tr>
            )}
            {appointments.map((item) => (
              <tr key={item.id}>
                <td>{item.counselor_name}</td>
                <td>{formatDbDate(item.scheduled_at)}</td>
                <td>{item.mode}</td>
                <td>
                  <span className={`badge ${item.status}`}>{item.status}</span>
                </td>
                <td className="inline-actions">
                  {item.status === 'approved' && item.mode === 'video' && (
                    <Link className="btn btn-primary" to={`/app/video/${item.id}`}>
                      Join video
                    </Link>
                  )}
                  {item.status === 'approved' && item.mode === 'chat' && (
                    <Link className="btn btn-secondary" to="/app/chat">
                      Open chat
                    </Link>
                  )}
                  {['pending', 'approved'].includes(item.status) && (
                    <button className="btn btn-danger" onClick={() => cancel(item.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
