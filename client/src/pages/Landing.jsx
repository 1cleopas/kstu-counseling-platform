import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div
          className="landing-hero-photo"
          style={{ backgroundImage: "url('/images/hero-campus.jpg')" }}
        />
        <div className="landing-hero-scrim">
          <nav className="landing-nav landing-nav-over anim-fade-down">
            <div className="brand">
              <div className="brand-badge">K</div>
              <div>
                <p className="brand-mark">KSTU Care</p>
                <small>Student Counseling Unit</small>
              </div>
            </div>
            <div className="nav-actions">
              <Link className="btn btn-secondary" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Get started
              </Link>
            </div>
          </nav>

          <div className="landing-hero-copy">
            <span className="eyebrow anim-rise delay-1">Kumasi Technical University</span>
            <h1 className="anim-rise delay-2">KSTU Care</h1>
            <p className="lead anim-rise delay-3">
              A smart web-based counseling platform for private appointment booking,
              client tracking, secure chat, and video counseling access.
            </p>
            <div className="nav-actions anim-rise delay-4" style={{ marginTop: '1.5rem' }}>
              <Link className="btn btn-primary" to="/register">
                Book support online
              </Link>
              <Link className="btn btn-secondary" to="/login">
                Counselor / Admin login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-visual">
        <div
          className="landing-visual-media"
          style={{ backgroundImage: "url('/images/support-session.jpg')" }}
          role="img"
          aria-label="Private counseling support session"
        />
        <div className="landing-visual-copy">
          <h2 className="anim-rise">Support without the walk-in queue</h2>
          <p className="anim-rise delay-1">
            Students can request help privately. Counselors manage profiles and
            session history. Administrators monitor service delivery.
          </p>
          <ul className="feature-list landing-feature-list">
            <li className="anim-rise delay-2">Role-based access for students, counselors, and admins</li>
            <li className="anim-rise delay-3">Online booking with approval and reminders</li>
            <li className="anim-rise delay-4">Real-time chat and WebRTC video sessions</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
