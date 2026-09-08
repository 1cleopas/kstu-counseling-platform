import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    session_date: '',
    session_type: 'video',
    summary: '',
    interventions: '',
    next_steps: ''
  });
  const [profileForm, setProfileForm] = useState({
    status: 'active',
    risk_level: 'low',
    presenting_issue: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  async function load() {
    const { data } = await api.get(`/clients/${id}`);
    setClient(data.client);
    setSessions(data.sessions || []);
    setProfileForm({
      status: data.client.status,
      risk_level: data.client.risk_level,
      presenting_issue: data.client.presenting_issue || '',
      notes: data.client.notes || ''
    });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveProfile(e) {
    e.preventDefault();
    await api.put(`/clients/${id}`, profileForm);
    setMessage('Client profile updated');
    load();
  }

  async function addSession(e) {
    e.preventDefault();
    await api.post(`/clients/${id}/sessions`, {
      ...form,
      session_date: form.session_date.replace('T', ' ') + ':00'
    });
    setForm({
      session_date: '',
      session_type: 'video',
      summary: '',
      interventions: '',
      next_steps: ''
    });
    setMessage('Session record saved');
    load();
  }

  if (!client) return <div>Loading client profile...</div>;

  return (
    <div>
      <PageBanner
        image="/images/calm-counseling.jpg"
        title={client.student_name}
        subtitle={`${client.student_number} · ${client.programme || client.department || 'Student client'}`}
      >
        <Link className="btn btn-secondary" to={`/app/reports?client=${client.id}`}>
          Student summary report
        </Link>
      </PageBanner>

      {message && <div className="success">{message}</div>}

      <div className="dual">
        <form className="panel form-grid" onSubmit={saveProfile}>
          <h3>Client profile</h3>
          <label>
            Status
            <select
              value={profileForm.status}
              onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label>
            Risk level
            <select
              value={profileForm.risk_level}
              onChange={(e) => setProfileForm({ ...profileForm, risk_level: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Presenting issue
            <textarea
              value={profileForm.presenting_issue}
              onChange={(e) => setProfileForm({ ...profileForm, presenting_issue: e.target.value })}
            />
          </label>
          <label>
            Counselor notes
            <textarea
              value={profileForm.notes}
              onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
            />
          </label>
          <button className="btn btn-primary">Save profile</button>
        </form>

        <form className="panel form-grid" onSubmit={addSession}>
          <h3>Add session record</h3>
          <label>
            Session date
            <input
              type="datetime-local"
              value={form.session_date}
              onChange={(e) => setForm({ ...form, session_date: e.target.value })}
              required
            />
          </label>
          <label>
            Type
            <select
              value={form.session_type}
              onChange={(e) => setForm({ ...form, session_type: e.target.value })}
            >
              <option value="video">Video</option>
              <option value="chat">Chat</option>
              <option value="in_person">In-person</option>
            </select>
          </label>
          <label>
            Summary
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              required
            />
          </label>
          <label>
            Interventions
            <textarea
              value={form.interventions}
              onChange={(e) => setForm({ ...form, interventions: e.target.value })}
            />
          </label>
          <label>
            Next steps
            <textarea
              value={form.next_steps}
              onChange={(e) => setForm({ ...form, next_steps: e.target.value })}
            />
          </label>
          <button className="btn btn-primary">Save session</button>
        </form>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>Session history</h3>
        <div className="stack">
          {sessions.length === 0 && <p className="muted">No session notes yet.</p>}
          {sessions.map((session) => (
            <div key={session.id}>
              <strong>{format(new Date(session.session_date), 'PPp')}</strong>
              <div className="muted">
                {session.session_type} · {session.counselor_name}
              </div>
              <p>{session.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
