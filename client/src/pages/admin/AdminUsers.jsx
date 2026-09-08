import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageBanner from '../../components/PageBanner';
import PasswordInput from '../../components/PasswordInput';

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
  const [error, setError] = useState('');
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  async function load() {
    const { data } = await api.get('/admin/users');
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', form);
      setForm(emptyForm);
      setMessage('User created successfully');
      load();
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Could not create user');
    }
  }

  async function toggleActive(user) {
    setError('');
    await api.patch(`/admin/users/${user.id}/active`, { is_active: !user.is_active });
    load();
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!passwordUser) return;
    setError('');
    try {
      const { data } = await api.patch(`/admin/users/${passwordUser.id}/password`, {
        password: newPassword
      });
      setMessage(data.message || 'Password updated');
      setPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Could not update password');
    }
  }

  return (
    <div>
      <PageBanner
        image="/images/university-campus.jpg"
        title="User management"
        subtitle="Create accounts, change passwords, and manage platform access."
      />

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

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
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
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
                    <div className="inline-actions">
                      <button className="btn btn-secondary" type="button" onClick={() => toggleActive(user)}>
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setPasswordUser(user);
                          setNewPassword('');
                          setError('');
                          setMessage('');
                        }}
                      >
                        Change password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {passwordUser ? (
        <form className="panel form-grid" onSubmit={changePassword} style={{ marginTop: '1.25rem' }}>
          <h3>Change password</h3>
          <p className="muted">
            Set a new password for <strong>{passwordUser.full_name}</strong> ({passwordUser.email}).
          </p>
          <label>
            New password
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <div className="inline-actions">
            <button className="btn btn-primary" type="submit">
              Save password
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setPasswordUser(null);
                setNewPassword('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
