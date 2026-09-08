import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';
import { formatDbDate } from '../../utils/dates';

export default function CounselorAppointments() {
  const [appointments, setAppointments] = useState([]);

  async function load() {
    const { data } = await api.get('/appointments');
    setAppointments(data.appointments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="Appointment requests"
        subtitle="Approve, reject, complete, or join online sessions."
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>When</th>
              <th>Mode</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan="6" className="muted">No appointment requests yet.</td>
              </tr>
            )}
            {appointments.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.student_name}</strong>
                  <div className="muted">{item.student_number || item.student_email}</div>
                </td>
                <td>{formatDbDate(item.scheduled_at)}</td>
                <td>{item.mode}</td>
                <td>{item.reason || '—'}</td>
                <td>
                  <span className={`badge ${item.status}`}>{item.status}</span>
                </td>
                <td className="inline-actions">
                  {item.status === 'pending' && (
                    <>
                      <button className="btn btn-primary" onClick={() => updateStatus(item.id, 'approved')}>
                        Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => updateStatus(item.id, 'rejected')}>
                        Reject
                      </button>
                    </>
                  )}
                  {item.status === 'approved' && item.mode === 'video' && (
                    <Link className="btn btn-secondary" to={`/app/video/${item.id}`}>
                      Start video
                    </Link>
                  )}
                  {item.status === 'approved' && (
                    <button className="btn btn-secondary" onClick={() => updateStatus(item.id, 'completed')}>
                      Mark completed
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
