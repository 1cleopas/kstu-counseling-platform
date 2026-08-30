const bcrypt = require('bcryptjs');

const KEEP_EMAIL = 'cleopas@student.kstu.edu.gh';

async function ensureDemoData() {
  const db = require('./config/db');
  if (db.driver !== 'sqlite') return;

  const { schema } = require('./db/sqliteSchema');
  try {
    await db.query('SELECT id FROM users LIMIT 1');
  } catch {
    db.exec(schema);
  }

  const users = await db.query('SELECT id FROM users LIMIT 1');
  if (users.length) return;

  const passwordHash = await bcrypt.hash('Password123!', 10);
  await db.query(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme, :specialization, :bio)`,
    {
      student_id: '052241360117',
      full_name: 'Cleopas Kwame Obbo',
      email: KEEP_EMAIL,
      password_hash: passwordHash,
      role: 'student',
      phone: '0200000004',
      department: 'Computer Science',
      programme: 'Computer Technology',
      specialization: null,
      bio: null
    }
  );

  console.log(`Demo student ready: ${KEEP_EMAIL} / Password123!`);
}

module.exports = { ensureDemoData };
