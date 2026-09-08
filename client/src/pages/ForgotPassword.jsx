import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email,
        student_id: studentId,
        phone
      });
      navigate(`/reset-password?token=${encodeURIComponent(data.token)}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify your account');
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
            <small>Password recovery</small>
          </div>
        </div>
        <h1>Forgot password</h1>
        <p className="muted">
          Confirm your email and identity. Students use student ID. Counselors and admins use the phone number on the
          account.
        </p>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Student ID (students)
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} autoComplete="off" />
          </label>
          <label>
            Phone (counselors and admins)
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Remembered it? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
