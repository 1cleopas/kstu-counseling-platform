import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../api/client';
import PageBanner from '../components/PageBanner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  async function load() {
    const { data } = await api.get('/notifications');
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await api.patch('/notifications/read-all');
    load();
  }

  async function markOne(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="Notifications"
        subtitle="Appointment updates and counseling alerts."
      >
        <button className="btn btn-secondary" onClick={markAll}>
          Mark all read
        </button>
      </PageBanner>

      <div className="stack">
        {notifications.length === 0 && <div className="panel muted">No notifications yet.</div>}
        {notifications.map((item) => (
          <div className="panel" key={item.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{format(new Date(item.created_at), 'PPp')}</div>
              </div>
              {!item.is_read && <span className="badge pending">unread</span>}
            </div>
            <p>{item.body}</p>
            {!item.is_read && (
              <button className="btn btn-ghost" onClick={() => markOne(item.id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
