const bcrypt = require('bcryptjs');

const STUDENT_EMAIL = 'cleopas@student.kstu.edu.gh';
const COUNSELOR_EMAIL = 'emily@counselor.kstu.edu.gh';
const DEMO_PASSWORD = 'Password123!';

async function ensureDemoAccounts(db) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const students = await db.query('SELECT id FROM users WHERE email = :email', { email: STUDENT_EMAIL });
  let studentId = students[0]?.id;
  if (!studentId) {
    const created = await db.query(
      `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
       VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme, :specialization, :bio)`,
      {
        student_id: '052241360117',
        full_name: 'Cleopas Kwame Obbo',
        email: STUDENT_EMAIL,
        password_hash: passwordHash,
        role: 'student',
        phone: '0200000004',
        department: 'Computer Science',
        programme: 'Computer Technology',
        specialization: null,
        bio: null
      }
    );
    studentId = created.insertId;
  }

  const counselors = await db.query('SELECT id FROM users WHERE email = :email', { email: COUNSELOR_EMAIL });
  let counselorId = counselors[0]?.id;
  if (!counselorId) {
    const created = await db.query(
      `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
       VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme, :specialization, :bio)`,
      {
        student_id: null,
        full_name: 'Dr. Emily',
        email: COUNSELOR_EMAIL,
        password_hash: passwordHash,
        role: 'counselor',
        phone: '0200000005',
        department: 'Counseling Unit',
        programme: null,
        specialization: 'Student Support',
        bio: 'KSTU Counseling Unit counselor.'
      }
    );
    counselorId = created.insertId;
  }

  if (studentId) {
    const profiles = await db.query('SELECT id FROM client_profiles WHERE student_id = :studentId', { studentId });
    if (!profiles.length) {
      await db.query(
        `INSERT INTO client_profiles (student_id, counselor_id, status) VALUES (:studentId, :counselorId, 'active')`,
        { studentId, counselorId: counselorId || null }
      );
    }
  }

  return { studentId, counselorId };
}

async function ensureDemoData() {
  const db = require('./config/db');
  if (db.driver !== 'sqlite') return;

  const { schema } = require('./db/sqliteSchema');
  try {
    await db.query('SELECT id FROM users LIMIT 1');
  } catch {
    db.exec(schema);
  }

  await ensureDemoAccounts(db);
}

module.exports = {
  STUDENT_EMAIL,
  COUNSELOR_EMAIL,
  DEMO_PASSWORD,
  ensureDemoAccounts,
  ensureDemoData
};
