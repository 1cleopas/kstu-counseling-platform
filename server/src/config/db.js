const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const dbDriver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();

let impl;

if (dbDriver === 'mysql') {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kstu_counseling',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });

  impl = {
    driver: 'mysql',
    async query(sql, params = {}) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    }
  };
} else {
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '..', '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'kstu_counseling.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  function toSqlite(sql) {
    return sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '@$1');
  }

  impl = {
    driver: 'sqlite',
    db,
    async query(sql, params = {}) {
      const converted = toSqlite(sql);
      const stmt = db.prepare(converted);
      const isSelect = /^\s*(SELECT|WITH|PRAGMA)/i.test(converted);
      if (isSelect) {
        return stmt.all(params);
      }
      const info = stmt.run(params);
      return { insertId: Number(info.lastInsertRowid), affectedRows: info.changes };
    },
    exec(sql) {
      db.exec(sql);
    }
  };
}

module.exports = impl;
