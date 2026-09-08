import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-backdrop" aria-hidden="true" />
        <div className="auth-card">
          <h1>Reset password</h1>
          <p className="muted">This reset link is missing. Start again from forgot password.</p>
          <p className="muted" style={{ marginTop: '1rem' }}>
            <Link to="/forgot-password">Forgot password</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <div className="brand-badge">K</div>
          <div>
            <p className="brand-mark">KSTU Care</p>
            <small>Set a new password</small>
          </div>
        </div>
        <h1>New password</h1>
        <p className="muted">Choose a password with at least 8 characters.</p>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <label>
            New password
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Update password'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
