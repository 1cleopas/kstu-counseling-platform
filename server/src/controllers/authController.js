const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

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
    const {
      full_name,
      email,
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

    const existing = await query('SELECT id FROM users WHERE email = :email', { email });
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
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const rows = await query('SELECT * FROM users WHERE email = :email AND is_active = 1', { email });
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

module.exports = { register, login, me, updateProfile };
