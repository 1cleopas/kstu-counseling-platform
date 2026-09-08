const { query } = require('../config/db');
const { sameId } = require('../utils/ids');

function startsWithPeriod(value, prefix) {
  return String(value || '').startsWith(prefix);
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const group = row[key] || 'unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
}

function uniqueCount(rows, key) {
  return new Set(rows.map((row) => String(row[key]))).size;
}

async function loadCounselorScope(req) {
  const params = {};
  let appointmentSql = `
    SELECT a.*,
      s.full_name AS student_name, s.student_id AS student_number, s.email AS student_email,
      c.full_name AS counselor_name
    FROM appointments a
    JOIN users s ON s.id = a.student_id
    JOIN users c ON c.id = a.counselor_id
  `;
  let sessionSql = `
    SELECT sr.*,
      s.full_name AS student_name, s.student_id AS student_number,
      u.full_name AS counselor_name
    FROM session_records sr
    JOIN client_profiles cp ON cp.id = sr.client_profile_id
    JOIN users s ON s.id = cp.student_id
    JOIN users u ON u.id = sr.counselor_id
  `;

  if (req.user.role === 'counselor') {
    appointmentSql += ' WHERE a.counselor_id = :counselorId';
    sessionSql += ' WHERE sr.counselor_id = :counselorId';
    params.counselorId = req.user.id;
  }

  appointmentSql += ' ORDER BY a.scheduled_at DESC';
  sessionSql += ' ORDER BY sr.session_date DESC';

  const [appointments, sessions] = await Promise.all([
    query(appointmentSql, params),
    query(sessionSql, params)
  ]);

  return { appointments, sessions };
}

function periodStats(appointments, sessions) {
  return {
    appointments: appointments.length,
    uniqueStudents: uniqueCount(appointments, 'student_id'),
    sessions: sessions.length,
    appointmentsByStatus: countBy(appointments, 'status'),
    appointmentsByMode: countBy(appointments, 'mode'),
    sessionsByType: countBy(sessions, 'session_type')
  };
}

async function studentSummary(req, res) {
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
    if (req.user.role === 'counselor' && client.counselor_id && !sameId(client.counselor_id, req.user.id)) {
      return res.status(403).json({ message: 'You can only report on your assigned clients' });
    }

    let appointmentSql = `
      SELECT a.*, c.full_name AS counselor_name
      FROM appointments a
      JOIN users c ON c.id = a.counselor_id
      WHERE a.student_id = :studentId
    `;
    const params = { studentId: client.student_id };
    if (req.user.role === 'counselor') {
      appointmentSql += ' AND a.counselor_id = :counselorId';
      params.counselorId = req.user.id;
    }
    appointmentSql += ' ORDER BY a.scheduled_at DESC';

    const appointments = await query(appointmentSql, params);
    const sessions = await query(
      `SELECT sr.*, u.full_name AS counselor_name
       FROM session_records sr
       JOIN users u ON u.id = sr.counselor_id
       WHERE sr.client_profile_id = :id
       ORDER BY sr.session_date DESC`,
      { id: client.id }
    );

    return res.json({
      reportType: 'student_summary',
      title: `Individual student summary — ${client.student_name}`,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.full_name,
      client,
      stats: {
        appointments: appointments.length,
        sessions: sessions.length,
        appointmentsByStatus: countBy(appointments, 'status'),
        sessionsByType: countBy(sessions, 'session_type')
      },
      appointments,
      sessions
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not generate student report' });
  }
}

async function monthlyReport(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'Valid year and month are required' });
    }

    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const { appointments, sessions } = await loadCounselorScope(req);
    const monthAppointments = appointments.filter((row) => startsWithPeriod(row.scheduled_at, prefix));
    const monthSessions = sessions.filter((row) => startsWithPeriod(row.session_date, prefix));
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

    return res.json({
      reportType: 'monthly',
      title: `Monthly counseling report — ${monthName}`,
      period: { year, month, label: monthName },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.full_name,
      stats: periodStats(monthAppointments, monthSessions),
      appointments: monthAppointments,
      sessions: monthSessions
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not generate monthly report' });
  }
}

async function yearlyReport(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'A valid year is required' });
    }

    const prefix = `${year}`;
    const { appointments, sessions } = await loadCounselorScope(req);
    const yearAppointments = appointments.filter((row) => startsWithPeriod(row.scheduled_at, prefix));
    const yearSessions = sessions.filter((row) => startsWithPeriod(row.session_date, prefix));

    const byMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      const monthAppointments = yearAppointments.filter((row) => startsWithPeriod(row.scheduled_at, monthPrefix));
      const monthSessions = yearSessions.filter((row) => startsWithPeriod(row.session_date, monthPrefix));
      return {
        month,
        label: new Date(year, index, 1).toLocaleString('en-GB', { month: 'long' }),
        appointments: monthAppointments.length,
        sessions: monthSessions.length,
        uniqueStudents: uniqueCount(monthAppointments, 'student_id')
      };
    });

    return res.json({
      reportType: 'yearly',
      title: `End of year counseling report — ${year}`,
      period: { year, label: String(year) },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.full_name,
      stats: periodStats(yearAppointments, yearSessions),
      byMonth,
      appointments: yearAppointments,
      sessions: yearSessions
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not generate yearly report' });
  }
}

module.exports = { studentSummary, monthlyReport, yearlyReport };
