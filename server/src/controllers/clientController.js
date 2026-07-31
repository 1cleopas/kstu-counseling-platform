const { query } = require('../config/db');

async function listClients(req, res) {
  try {
    let sql = `
      SELECT cp.*,
        s.full_name AS student_name, s.student_id AS student_number, s.email AS student_email,
        s.department, s.programme, s.phone,
        c.full_name AS counselor_name
      FROM client_profiles cp
      JOIN users s ON s.id = cp.student_id
      LEFT JOIN users c ON c.id = cp.counselor_id
    `;
    const params = {};

    if (req.user.role === 'counselor') {
      sql += ' WHERE cp.counselor_id = :counselorId OR cp.counselor_id IS NULL';
      params.counselorId = req.user.id;
    } else if (req.user.role === 'student') {
      sql += ' WHERE cp.student_id = :studentId';
      params.studentId = req.user.id;
    }

    sql += ' ORDER BY cp.updated_at DESC';
    const clients = await query(sql, params);
    return res.json({ clients });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load clients' });
  }
}

async function getClient(req, res) {
  try {
    const clients = await query(
      `SELECT cp.*,
        s.full_name AS student_name, s.student_id AS student_number, s.email AS student_email,
        s.department, s.programme, s.phone,
        c.full_name AS counselor_name
       FROM client_profiles cp
       JOIN users s ON s.id = cp.student_id
       LEFT JOIN users c ON c.id = cp.counselor_id
       WHERE cp.id = :id`,
      { id: req.params.id }
    );

    if (!clients.length) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const client = clients[0];
    if (
      req.user.role === 'student' &&
      client.student_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sessions = await query(
      `SELECT sr.*, u.full_name AS counselor_name
       FROM session_records sr
       JOIN users u ON u.id = sr.counselor_id
       WHERE sr.client_profile_id = :id
       ORDER BY sr.session_date DESC`,
      { id: req.params.id }
    );

    return res.json({ client, sessions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load client profile' });
  }
}

async function updateClient(req, res) {
  try {
    const { status, risk_level, presenting_issue, notes, counselor_id } = req.body;
    const id = req.params.id;

    const existing = await query('SELECT * FROM client_profiles WHERE id = :id', { id });
    if (!existing.length) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    await query(
      `UPDATE client_profiles SET
        status = COALESCE(:status, status),
        risk_level = COALESCE(:risk_level, risk_level),
        presenting_issue = COALESCE(:presenting_issue, presenting_issue),
        notes = COALESCE(:notes, notes),
        counselor_id = COALESCE(:counselor_id, counselor_id)
       WHERE id = :id`,
      {
        id,
        status: status || null,
        risk_level: risk_level || null,
        presenting_issue: presenting_issue || null,
        notes: notes || null,
        counselor_id: counselor_id || (req.user.role === 'counselor' ? req.user.id : null)
      }
    );

    const updated = await query('SELECT * FROM client_profiles WHERE id = :id', { id });
    return res.json({ client: updated[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not update client profile' });
  }
}

async function addSessionRecord(req, res) {
  try {
    const { session_date, session_type = 'video', summary, interventions, next_steps, appointment_id } = req.body;
    const client_profile_id = req.params.id;

    if (!session_date || !summary) {
      return res.status(400).json({ message: 'Session date and summary are required' });
    }

    const result = await query(
      `INSERT INTO session_records
        (client_profile_id, counselor_id, appointment_id, session_date, session_type, summary, interventions, next_steps)
       VALUES
        (:client_profile_id, :counselor_id, :appointment_id, :session_date, :session_type, :summary, :interventions, :next_steps)`,
      {
        client_profile_id,
        counselor_id: req.user.id,
        appointment_id: appointment_id || null,
        session_date,
        session_type,
        summary,
        interventions: interventions || null,
        next_steps: next_steps || null
      }
    );

    await query(
      `UPDATE client_profiles SET counselor_id = :counselor_id, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { counselor_id: req.user.id, id: client_profile_id }
    );

    if (appointment_id) {
      await query(`UPDATE appointments SET status = 'completed' WHERE id = :id`, { id: appointment_id });
    }

    const rows = await query('SELECT * FROM session_records WHERE id = :id', { id: result.insertId });
    return res.status(201).json({ session: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not save session record' });
  }
}

module.exports = { listClients, getClient, updateClient, addSessionRecord };
