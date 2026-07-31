const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

async function dashboard(req, res) {
  try {
    const [students] = await query(`SELECT COUNT(*) AS count FROM users WHERE role = 'student'`);
    const [counselors] = await query(`SELECT COUNT(*) AS count FROM users WHERE role = 'counselor'`);
    const [appointments] = await query(`SELECT COUNT(*) AS count FROM appointments`);
    const [pending] = await query(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'pending'`);
    const [completed] = await query(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'completed'`);
    const [sessions] = await query(`SELECT COUNT(*) AS count FROM session_records`);
    const [messages] = await query(`SELECT COUNT(*) AS count FROM messages`);
    const [activeClients] = await query(`SELECT COUNT(*) AS count FROM client_profiles WHERE status = 'active'`);

    const recentAppointments = await query(
      `SELECT a.id, a.scheduled_at, a.status, a.mode,
        s.full_name AS student_name, c.full_name AS counselor_name
       FROM appointments a
       JOIN users s ON s.id = a.student_id
       JOIN users c ON c.id = a.counselor_id
       ORDER BY a.created_at DESC
       LIMIT 8`
    );

    const appointmentsByStatus = await query(
      `SELECT status, COUNT(*) AS count FROM appointments GROUP BY status`
    );

    return res.json({
      stats: {
        students: students.count,
        counselors: counselors.count,
        appointments: appointments.count,
        pending: pending.count,
        completed: completed.count,
        sessions: sessions.count,
        messages: messages.count,
        activeClients: activeClients.count
      },
      recentAppointments,
      appointmentsByStatus
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load admin dashboard' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await query(
      `SELECT id, student_id, full_name, email, role, phone, department, programme, specialization, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load users' });
  }
}

async function createUser(req, res) {
  try {
    const { full_name, email, password, role, student_id, phone, department, programme, specialization } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization)
       VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme, :specialization)`,
      {
        student_id: student_id || null,
        full_name,
        email,
        password_hash,
        role,
        phone: phone || null,
        department: department || null,
        programme: programme || null,
        specialization: specialization || null
      }
    );

    if (role === 'student') {
      await query(`INSERT INTO client_profiles (student_id) VALUES (:id)`, { id: result.insertId });
    }

    const users = await query(
      `SELECT id, student_id, full_name, email, role, phone, department, programme, specialization, is_active, created_at
       FROM users WHERE id = :id`,
      { id: result.insertId }
    );
    return res.status(201).json({ user: users[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not create user' });
  }
}

async function setUserActive(req, res) {
  try {
    const { is_active } = req.body;
    await query(`UPDATE users SET is_active = :is_active WHERE id = :id`, {
      id: req.params.id,
      is_active: is_active ? 1 : 0
    });
    return res.json({ message: 'User updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update user' });
  }
}

async function listCounselors(req, res) {
  try {
    const counselors = await query(
      `SELECT id, full_name, email, phone, specialization, bio, department
       FROM users
       WHERE role = 'counselor' AND is_active = 1
       ORDER BY full_name`
    );
    return res.json({ counselors });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load counselors' });
  }
}

module.exports = { dashboard, listUsers, createUser, setUserActive, listCounselors };
