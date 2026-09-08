import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

const now = new Date();
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function countsList(obj = {}) {
  const entries = Object.entries(obj);
  if (!entries.length) return 'None';
  return entries.map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join(' · ');
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'PPp');
}

export default function ReportsPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('student');
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(searchParams.get('client') || '');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return [current - 2, current - 1, current, current + 1];
  }, []);

  useEffect(() => {
    api.get('/clients').then((res) => {
      const list = res.data.clients || [];
      setClients(list);
      const preset = searchParams.get('client');
      if (preset) {
        setClientId(String(preset));
        setTab('student');
        api
          .get(`/reports/clients/${preset}`)
          .then((reportRes) => setReport(reportRes.data))
          .catch((err) => setError(err.response?.data?.message || 'Could not generate report'));
      } else if (!clientId && list[0]) {
        setClientId(String(list[0].id));
      }
    });
  }, []);

  async function generate(e) {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    setReport(null);
    try {
      let path = `/reports/monthly?year=${year}&month=${month}`;
      if (tab === 'student') {
        if (!clientId) {
          setError('Select a student first');
          setLoading(false);
          return;
        }
        path = `/reports/clients/${clientId}`;
      } else if (tab === 'yearly') {
        path = `/reports/yearly?year=${year}`;
      }
      const { data } = await api.get(path);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate report');
    } finally {
      setLoading(false);
    }
  }

  function printReport() {
    window.print();
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="Client reports"
        subtitle="Generate individual student summaries, monthly caseload reports, and end-of-year reports."
      />

      <div className="panel form-grid no-print">
        <div className="inline-actions">
          <button
            type="button"
            className={`btn ${tab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('student')}
          >
            Student summary
          </button>
          <button
            type="button"
            className={`btn ${tab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('monthly')}
          >
            Monthly report
          </button>
          <button
            type="button"
            className={`btn ${tab === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('yearly')}
          >
            End of year
          </button>
        </div>

        {tab === 'student' && (
          <label>
            Student
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              {clients.length === 0 && <option value="">No clients yet</option>}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.student_name} {client.student_number ? `· ${client.student_number}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {tab === 'monthly' && (
          <div className="dual">
            <label>
              Month
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((label, index) => (
                  <option key={label} value={String(index + 1)}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Year
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {tab === 'yearly' && (
          <label>
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary" type="button" disabled={loading} onClick={generate}>
          {loading ? 'Generating...' : 'Generate report'}
        </button>
      </div>

      {report && (
        <div className="panel report-paper" style={{ marginTop: '1rem' }}>
          <div className="inline-actions no-print" style={{ justifyContent: 'space-between' }}>
            <h3>{report.title}</h3>
            <button className="btn btn-secondary" type="button" onClick={printReport}>
              Print / Save PDF
            </button>
          </div>
          <p className="muted">
            KSTU Care Counseling Unit · Prepared by {report.generatedBy} ·{' '}
            {safeDate(report.generatedAt)}
          </p>

          {report.client && (
            <div className="stack" style={{ marginTop: '1rem' }}>
              <h4>Student details</h4>
              <p>
                <strong>{report.client.student_name}</strong>
                <br />
                ID: {report.client.student_number || '—'} · Email: {report.client.student_email}
                <br />
                Programme: {report.client.programme || '—'} · Department: {report.client.department || '—'}
                <br />
                Status: {report.client.status} · Risk: {report.client.risk_level} · Counselor:{' '}
                {report.client.counselor_name || 'Unassigned'}
              </p>
              {report.client.presenting_issue && (
                <p>
                  <strong>Presenting issue:</strong> {report.client.presenting_issue}
                </p>
              )}
              {report.client.notes && (
                <p>
                  <strong>Counselor notes:</strong> {report.client.notes}
                </p>
              )}
            </div>
          )}

          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <span>Appointments</span>
              <strong>{report.stats.appointments}</strong>
            </div>
            <div className="stat-card">
              <span>Sessions recorded</span>
              <strong>{report.stats.sessions}</strong>
            </div>
            {report.stats.uniqueStudents != null && (
              <div className="stat-card">
                <span>Students seen</span>
                <strong>{report.stats.uniqueStudents}</strong>
              </div>
            )}
          </div>

          <p style={{ marginTop: '1rem' }}>
            <strong>Appointments by status:</strong> {countsList(report.stats.appointmentsByStatus)}
            <br />
            {report.stats.appointmentsByMode && (
              <>
                <strong>Appointments by mode:</strong> {countsList(report.stats.appointmentsByMode)}
                <br />
              </>
            )}
            <strong>Sessions by type:</strong> {countsList(report.stats.sessionsByType)}
          </p>

          {report.byMonth && (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <h4>Monthly breakdown</h4>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Appointments</th>
                    <th>Sessions</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byMonth.map((row) => (
                    <tr key={row.month}>
                      <td>{row.label}</td>
                      <td>{row.appointments}</td>
                      <td>{row.sessions}</td>
                      <td>{row.uniqueStudents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <h4>Appointments</h4>
            {report.appointments?.length === 0 && <p className="muted">No appointments in this period.</p>}
            {report.appointments?.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>When</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.appointments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.student_name || report.client?.student_name}</td>
                      <td>{safeDate(item.scheduled_at)}</td>
                      <td>{item.mode}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4>Session notes</h4>
            {report.sessions?.length === 0 && <p className="muted">No session records in this period.</p>}
            <div className="stack">
              {report.sessions?.map((session) => (
                <div key={session.id}>
                  <strong>{safeDate(session.session_date)}</strong>
                  <div className="muted">
                    {session.student_name || report.client?.student_name} · {session.session_type} ·{' '}
                    {session.counselor_name}
                  </div>
                  <p>{session.summary}</p>
                  {session.interventions && (
                    <p>
                      <strong>Interventions:</strong> {session.interventions}
                    </p>
                  )}
                  {session.next_steps && (
                    <p>
                      <strong>Next steps:</strong> {session.next_steps}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
