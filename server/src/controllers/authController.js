const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function verifyGoogleIdToken(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error('Google sign-in is not configured yet');
    error.status = 503;
    throw error;
  }
  if (!credential) {
    const error = new Error('Google credential is required');
    error.status = 400;
    throw error;
  }

  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();
  const email = String(payload?.email || '').trim().toLowerCase();

  if (!email || payload.email_verified === false) {
    const error = new Error('Google did not provide a verified email');
    error.status = 401;
    throw error;
  }

  return { email, payload };
}

async function issuePasswordReset(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await query(
    `UPDATE users SET password_reset_token = :token, password_reset_expires = :expires WHERE id = :id`,
    { id: user.id, token: hashResetToken(token), expires }
  );
  return token;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, full_name: user.full_name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    student_id: user.student_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    programme: user.programme,
    specialization: user.specialization,
    bio: user.bio
  };
}

async function register(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const {
      full_name,
      password,
      role = 'student',
      student_id,
      phone,
      department,
      programme
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required' });
    }

    if (!['student', 'counselor'].includes(role)) {
      return res.status(400).json({ message: 'Only student or counselor self-registration is allowed' });
    }

    if (role === 'student' && !student_id) {
      return res.status(400).json({ message: 'Student ID is required for student accounts' });
    }

    const existing = await query('SELECT id FROM users WHERE lower(email) = :email', { email });
    if (existing.length) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme)
       VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme)`,
      {
        student_id: student_id || null,
        full_name,
        email,
        password_hash,
        role,
        phone: phone || null,
        department: department || null,
        programme: programme || null
      }
    );

    if (role === 'student') {
      await query(
        `INSERT INTO client_profiles (student_id, status) VALUES (:studentId, 'active')`,
        { studentId: result.insertId }
      );
    }

    const rows = await query('SELECT * FROM users WHERE id = :id', { id: result.insertId });
    const user = rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const rows = await query('SELECT * FROM users WHERE lower(email) = :email AND is_active = 1', {
      email: normalizedEmail
    });
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const rows = await query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load profile' });
  }
}

async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const studentId = String(req.body.student_id || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const rows = await query('SELECT * FROM users WHERE lower(email) = :email AND is_active = 1', { email });
    const user = rows[0];
    if (!user) {
      return res.status(400).json({ message: 'We could not verify that account.' });
    }

    const identityOk =
      user.role === 'student'
        ? Boolean(studentId) && studentId === String(user.student_id || '')
        : Boolean(phone) && normalizePhone(phone) === normalizePhone(user.phone);

    if (!identityOk) {
      return res.status(400).json({
        message:
          user.role === 'student'
            ? 'Email and student ID did not match.'
            : 'Email and phone number did not match.'
      });
    }

    const token = await issuePasswordReset(user);
    return res.json({ token, message: 'Identity verified. Set a new password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Could not start password reset' });
  }
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (!token || password.length < 8) {
      return res.status(400).json({ message: 'A valid reset token and an 8+ character password are required' });
    }

    const tokenHash = hashResetToken(token);
    const now = new Date().toISOString();
    const rows = await query(
      `SELECT id FROM users
       WHERE password_reset_token = :tokenHash
         AND password_reset_expires IS NOT NULL
         AND password_reset_expires > :now
         AND is_active = 1`,
      { tokenHash, now }
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await query(
      `UPDATE users
       SET password_hash = :password_hash, password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = :id`,
      { id: rows[0].id, password_hash }
    );

    return res.json({ message: 'Password updated. You can sign in now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Could not reset password' });
  }
}

async function googleConfig(_req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return res.json({ clientId: clientId || null });
}

async function googleLogin(req, res) {
  try {
    const { email, payload } = await verifyGoogleIdToken(req.body.credential);
    const rows = await query('SELECT * FROM users WHERE lower(email) = :email', { email });
    let user = rows[0];

    if (user && !user.is_active) {
      return res.status(401).json({ message: 'This account is disabled' });
    }

    if (!user) {
      const password_hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const result = await query(
        `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme)
         VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme)`,
        {
          student_id: `G-${String(payload.sub || '').slice(-10)}`,
          full_name: payload.name || email.split('@')[0],
          email,
          password_hash,
          role: 'student',
          phone: null,
          department: null,
          programme: null
        }
      );
      await query(`INSERT INTO client_profiles (student_id, status) VALUES (:studentId, 'active')`, {
        studentId: result.insertId
      });
      const created = await query('SELECT * FROM users WHERE id = :id', { id: result.insertId });
      user = created[0];
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(error.status || 401).json({ message: error.message || 'Google sign-in failed' });
  }
}

async function forgotPasswordGoogle(req, res) {
  try {
    const { email } = await verifyGoogleIdToken(req.body.credential);
    const rows = await query('SELECT * FROM users WHERE lower(email) = :email', { email });
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(400).json({
        message: 'No active KSTU Care account uses that Gmail. Register or sign in with Google first.'
      });
    }

    const token = await issuePasswordReset(user);
    return res.json({ token, message: 'Gmail verified. Set a new password.' });
  } catch (error) {
    console.error('Forgot password Google error:', error);
    return res.status(error.status || 401).json({ message: error.message || 'Google verification failed' });
  }
}

async function updateProfile(req, res) {
  try {
    const { full_name, phone, department, programme, specialization, bio } = req.body;
    await query(
      `UPDATE users SET
        full_name = COALESCE(:full_name, full_name),
        phone = COALESCE(:phone, phone),
        department = COALESCE(:department, department),
        programme = COALESCE(:programme, programme),
        specialization = COALESCE(:specialization, specialization),
        bio = COALESCE(:bio, bio)
       WHERE id = :id`,
      {
        id: req.user.id,
        full_name: full_name || null,
        phone: phone || null,
        department: department || null,
        programme: programme || null,
        specialization: specialization || null,
        bio: bio || null
      }
    );
    const rows = await query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Profile update failed' });
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleConfig,
  googleLogin,
  forgotPasswordGoogle
};
