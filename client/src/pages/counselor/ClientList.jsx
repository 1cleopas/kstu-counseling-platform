import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

export default function ClientList() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data.clients || []));
  }, []);

  return (
    <div>
      <PageBanner
        image="/images/calm-counseling.jpg"
        title="Client tracking"
        subtitle="Create continuity of care with structured student client profiles."
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Programme</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Counselor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.student_name}</strong>
                  <div className="muted">{client.student_number || client.student_email}</div>
                </td>
                <td>
                  {client.programme || '—'}
                  <div className="muted">{client.department}</div>
                </td>
                <td>
                  <span className={`badge ${client.risk_level}`}>{client.risk_level}</span>
                </td>
                <td>
                  <span className="badge">{client.status}</span>
                </td>
                <td>{client.counselor_name || 'Unassigned'}</td>
                <td>
                  <Link className="btn btn-secondary" to={`/app/clients/${client.id}`}>
                    Open profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
