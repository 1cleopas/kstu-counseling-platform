import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    student_id: '',
    phone: '',
    department: '',
    programme: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <div className="brand-badge">K</div>
          <div>
            <p className="brand-mark">KSTU Care</p>
            <small>Create your account</small>
          </div>
        </div>
        <h1>Join the platform</h1>
        <p className="muted">Register as a student or counselor to get started.</p>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <label>
            Full name
            <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </label>
          <label>
            Password
            <PasswordInput
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="counselor">Counselor</option>
            </select>
          </label>
          {form.role === 'student' && (
            <label>
              Student ID
              <input value={form.student_id} onChange={(e) => update('student_id', e.target.value)} required />
            </label>
          )}
          <label>
            Department
            <input value={form.department} onChange={(e) => update('department', e.target.value)} />
          </label>
          <label>
            Programme
            <input value={form.programme} onChange={(e) => update('programme', e.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
