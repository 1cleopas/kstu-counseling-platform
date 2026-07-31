const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const KEEP_EMAIL = 'cleopas@student.kstu.edu.gh';

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

  const passwordHash = await bcrypt.hash('Password123!', 10);
  await connection.execute(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '052241360117',
      'Cleopas Kwame Obbo',
      KEEP_EMAIL,
      passwordHash,
      'student',
      '0200000004',
      'Computer Science',
      'Computer Technology',
      null,
      null
    ]
  );

  console.log('MySQL schema applied. Only Cleopas student account retained.');
  await connection.end();
}

async function seedSqlite() {
  const Database = require('better-sqlite3');
  const { schema } = require('./db/sqliteSchema');
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.SQLITE_PATH || path.join(dataDir, 'kstu_counseling.db');

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

  const passwordHash = await bcrypt.hash('Password123!', 10);
  db.prepare(
    `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
     VALUES (@student_id, @full_name, @email, @password_hash, @role, @phone, @department, @programme, @specialization, @bio)`
  ).run({
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
  });

  console.log(`SQLite database ready at ${dbPath}`);
  console.log('Only Cleopas student account retained. Demo appointments and other users cleared.');
  db.close();
}

async function run() {
  const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();
  if (driver === 'mysql') {
    await seedMysql();
  } else {
    await seedSqlite();
  }

  console.log(`Login: ${KEEP_EMAIL}`);
  console.log('Password: Password123!');
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
