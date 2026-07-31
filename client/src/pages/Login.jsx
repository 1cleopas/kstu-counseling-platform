import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('cleopas@student.kstu.edu.gh');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
            <small>Secure sign in</small>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Access counseling services with your KSTU account.</p>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          New student? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
