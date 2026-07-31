const { query } = require('../config/db');
const { createNotification } = require('../utils/notify');

async function listAppointments(req, res) {
  try {
    let sql = `
      SELECT a.*,
        s.full_name AS student_name, s.student_id AS student_number, s.email AS student_email,
        c.full_name AS counselor_name, c.email AS counselor_email
      FROM appointments a
      JOIN users s ON s.id = a.student_id
      JOIN users c ON c.id = a.counselor_id
    `;
    const params = {};

    if (req.user.role === 'student') {
      sql += ' WHERE a.student_id = :userId';
      params.userId = req.user.id;
    } else if (req.user.role === 'counselor') {
      sql += ' WHERE a.counselor_id = :userId';
      params.userId = req.user.id;
    }

    sql += ' ORDER BY a.scheduled_at DESC';
    const appointments = await query(sql, params);
    return res.json({ appointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load appointments' });
  }
}

async function createAppointment(req, res) {
  try {
    const { counselor_id, scheduled_at, duration_minutes = 45, mode = 'video', reason } = req.body;

    if (!counselor_id || !scheduled_at) {
      return res.status(400).json({ message: 'Counselor and schedule time are required' });
    }

    const counselors = await query(
      `SELECT id, full_name FROM users WHERE id = :id AND role = 'counselor' AND is_active = 1`,
      { id: counselor_id }
    );
    if (!counselors.length) {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const result = await query(
      `INSERT INTO appointments (student_id, counselor_id, scheduled_at, duration_minutes, mode, reason, status)
       VALUES (:student_id, :counselor_id, :scheduled_at, :duration_minutes, :mode, :reason, 'pending')`,
      {
        student_id: req.user.id,
        counselor_id,
        scheduled_at,
        duration_minutes,
        mode,
        reason: reason || null
      }
    );

    await createNotification(
      counselor_id,
      'New appointment request',
      `${req.user.full_name} requested a ${mode} session on ${scheduled_at}.`,
      'appointment'
    );

    const rows = await query('SELECT * FROM appointments WHERE id = :id', { id: result.insertId });
    return res.status(201).json({ appointment: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not book appointment' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, counselor_notes } = req.body;
    const allowed = ['approved', 'rejected', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const rows = await query('SELECT * FROM appointments WHERE id = :id', { id });
    if (!rows.length) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = rows[0];
    if (req.user.role === 'counselor' && appointment.counselor_id !== req.user.id) {
      return res.status(403).json({ message: 'Not your appointment' });
    }
    if (req.user.role === 'student' && (appointment.student_id !== req.user.id || status !== 'cancelled')) {
      return res.status(403).json({ message: 'Students can only cancel their appointments' });
    }

    await query(
      `UPDATE appointments SET status = :status, counselor_notes = COALESCE(:counselor_notes, counselor_notes)
       WHERE id = :id`,
      { id, status, counselor_notes: counselor_notes || null }
    );

    const notifyUser = req.user.role === 'counselor' ? appointment.student_id : appointment.counselor_id;
    await createNotification(
      notifyUser,
      'Appointment updated',
      `Appointment #${id} is now ${status}.`,
      'appointment'
    );

    const updated = await query('SELECT * FROM appointments WHERE id = :id', { id });
    return res.json({ appointment: updated[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not update appointment' });
  }
}

module.exports = { listAppointments, createAppointment, updateAppointmentStatus };
