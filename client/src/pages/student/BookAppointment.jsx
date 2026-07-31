import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [form, setForm] = useState({
    counselor_id: '',
    scheduled_at: '',
    duration_minutes: 45,
    mode: 'video',
    reason: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/counselors').then((res) => {
      setCounselors(res.data.counselors || []);
      if (res.data.counselors?.[0]) {
        setForm((prev) => ({ ...prev, counselor_id: String(res.data.counselors[0].id) }));
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/appointments', {
        ...form,
        counselor_id: Number(form.counselor_id),
        scheduled_at: form.scheduled_at.replace('T', ' ') + ':00'
      });
      setMessage('Appointment request submitted. A counselor will review it shortly.');
      setTimeout(() => navigate('/app/appointments'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="Book an appointment"
        subtitle="Choose a counselor, session mode, and preferred time."
      />

      <form className="panel form-grid" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <label>
          Counselor
          <select
            value={form.counselor_id}
            onChange={(e) => setForm({ ...form, counselor_id: e.target.value })}
            required
          >
            {counselors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.specialization ? `· ${c.specialization}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preferred date & time
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            required
          />
        </label>
        <label>
          Session mode
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <option value="video">Video counseling</option>
            <option value="chat">Chat counseling</option>
            <option value="in_person">In-person</option>
          </select>
        </label>
        <label>
          Reason for visit
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Briefly describe what you would like support with"
          />
        </label>
        <button className="btn btn-primary">Submit request</button>
      </form>
    </div>
  );
}
