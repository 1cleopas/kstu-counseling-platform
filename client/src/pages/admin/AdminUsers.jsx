import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';

const emptyForm = {
  full_name: '',
  email: '',
  password: 'Password123!',
  role: 'counselor',
  student_id: '',
  phone: '',
  department: 'Counseling Unit',
  programme: '',
  specialization: ''
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  async function load() {
    const { data } = await api.get('/admin/users');
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    await api.post('/admin/users', form);
    setForm(emptyForm);
    setMessage('User created successfully');
    load();
  }

  async function toggleActive(user) {
    await api.patch(`/admin/users/${user.id}/active`, { is_active: !user.is_active });
    load();
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="User management"
        subtitle="Create counselor/admin accounts and manage platform access."
      />

      {message && <div className="success">{message}</div>}

      <div className="dual">
        <form className="panel form-grid" onSubmit={createUser}>
          <h3>Create user</h3>
          <label>
            Full name
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="counselor">Counselor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Specialization
            <input
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </label>
          <button className="btn btn-primary">Create account</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong>
                    <div className="muted">{user.email}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <span className="badge">{user.is_active ? 'active' : 'inactive'}</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => toggleActive(user)}>
                      {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
