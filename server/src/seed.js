const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { STUDENT_EMAIL, COUNSELOR_EMAIL, ADMIN_EMAIL, DEMO_PASSWORD } = require('./ensureDemoData');

async function seedMysql() {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await connection.query(schema);
  await connection.query('USE kstu_counseling');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'messages',
    'conversations',
    'notifications',
    'session_records',
    'appointments',
    'counselor_availability',
    'client_profiles',
    'users'
  ]) {
    await connection.query(`TRUNCATE TABLE ${table}`);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await connection.execute(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '052241360117',
      'Cleopas Kwame Obbo',
      STUDENT_EMAIL,
      passwordHash,
      'student',
      '0200000004',
      'Computer Science',
      'Computer Technology',
      null,
      null
    ]
  );
  const [studentRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [STUDENT_EMAIL]);
  await connection.execute(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      null,
      'Dr. Emily',
      COUNSELOR_EMAIL,
      passwordHash,
      'counselor',
      '0200000005',
      'Counseling Unit',
      null,
      'Student Support',
      'KSTU Counseling Unit counselor.'
    ]
  );
  const [counselorRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [COUNSELOR_EMAIL]);
  await connection.execute(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      null,
      'Platform Admin',
      ADMIN_EMAIL,
      passwordHash,
      'admin',
      '0200000001',
      'Counseling Unit',
      null,
      null,
      'KSTU Care platform administrator.'
    ]
  );
  await connection.execute(
    `INSERT INTO client_profiles (student_id, counselor_id, status) VALUES (?, ?, 'active')`,
    [studentRows[0].id, counselorRows[0].id]
  );

  console.log('MySQL schema applied with student, counselor, and admin demo accounts.');
  await connection.end();
}

async function seedSqlite() {
  const Database = require('better-sqlite3');
  const { schema } = require('./db/sqliteSchema');
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'kstu_counseling.db');

  let db;
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      db = new Database(dbPath);
      db.pragma('foreign_keys = ON');
      db.exec(schema);
    } catch (error) {
      if (error.code !== 'EBUSY' && error.code !== 'EPERM') throw error;
      db = new Database(dbPath);
      db.pragma('foreign_keys = ON');
      for (const table of [
        'messages',
        'conversations',
        'notifications',
        'session_records',
        'appointments',
        'counselor_availability',
        'client_profiles',
        'users'
      ]) {
        db.exec(`DELETE FROM ${table}`);
      }
    }
  } else {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.exec(schema);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const insertUser = db.prepare(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (@student_id, @full_name, @email, @password_hash, @role, @phone, @department, @programme, @specialization, @bio)`
  );
  const student = insertUser.run({
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
  });
  const counselor = insertUser.run({
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
  });
  insertUser.run({
    student_id: null,
    full_name: 'Platform Admin',
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    role: 'admin',
    phone: '0200000001',
    department: 'Counseling Unit',
    programme: null,
    specialization: null,
    bio: 'KSTU Care platform administrator.'
  });
  db.prepare(
    `INSERT INTO client_profiles (student_id, counselor_id, status) VALUES (?, ?, 'active')`
  ).run(student.lastInsertRowid, counselor.lastInsertRowid);

  console.log(`SQLite database ready at ${dbPath}`);
  db.close();
}

async function run() {
  const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();
  if (driver === 'mysql') {
    await seedMysql();
  } else {
    await seedSqlite();
  }

  console.log(`Student login: ${STUDENT_EMAIL}`);
  console.log(`Counselor login: ${COUNSELOR_EMAIL}`);
  console.log(`Admin login: ${ADMIN_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
