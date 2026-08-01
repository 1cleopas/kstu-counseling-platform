const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const { initChatSocket } = require('./socket/chatSocket');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const allowed =
        !origin ||
        clientUrls.includes(origin) ||
        /\.vercel\.app$/i.test(origin) ||
        /\.loca\.lt$/i.test(origin) ||
        /\.trycloudflare\.com$/i.test(origin) ||
        process.env.NODE_ENV !== 'production';
      if (allowed) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'KSTU Counseling Platform API',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed =
        !origin ||
        clientUrls.includes(origin) ||
        /\.vercel\.app$/i.test(origin) ||
        /\.loca\.lt$/i.test(origin) ||
        /\.trycloudflare\.com$/i.test(origin) ||
        process.env.NODE_ENV !== 'production';
      callback(null, allowed);
    },
    methods: ['GET', 'POST']
  }
});
initChatSocket(io);

const peerServer = ExpressPeerServer(server, {
  path: '/',
  debug: process.env.NODE_ENV !== 'production'
});
app.use('/peerjs', peerServer);

const PORT = process.env.PORT || 5000;

async function ensureDatabase() {
  try {
    const db = require('./config/db');
    if (db.driver === 'sqlite') {
      const { schema } = require('./db/sqliteSchema');
      db.exec(schema);
      const users = await db.query('SELECT COUNT(*) AS count FROM users');
      const count = Number(users?.[0]?.count || 0);
      if (count === 0) {
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('Password123!', 10);
        await db.query(
          `INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio)
           VALUES (:student_id, :full_name, :email, :password_hash, :role, :phone, :department, :programme, :specialization, :bio)`,
          {
            student_id: '052241360117',
            full_name: 'Cleopas Kwame Obbo',
            email: 'cleopas@student.kstu.edu.gh',
            password_hash: passwordHash,
            role: 'student',
            phone: '0200000004',
            department: 'Computer Science',
            programme: 'Computer Technology',
            specialization: null,
            bio: null
          }
        );
        console.log('Seeded Cleopas student account');
      }
    }
  } catch (error) {
    console.error('Database bootstrap failed:', error.message);
  }
}

ensureDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KSTU Counseling API running on port ${PORT}`);
    console.log(`PeerJS signaling available at /peerjs`);
  });
});
