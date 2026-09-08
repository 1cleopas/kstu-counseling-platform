const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const { initChatSocket } = require('./socket/chatSocket');
const { ensureDemoData } = require('./ensureDemoData');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'kstu-care-dev-secret';
}

const app = express();
const server = http.createServer(app);

const clientUrls = [
  ...(process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(','),
  process.env.RENDER_EXTERNAL_URL || ''
]
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      try {
        const host = new URL(origin).hostname;
        if (host.endsWith('.onrender.com') || host.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // ignore invalid origin
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
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

const peerServer = ExpressPeerServer(server, {
  path: '/',
  debug: process.env.NODE_ENV !== 'production'
});
app.use('/peerjs', peerServer);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api(?:\/|$)|\/peerjs(?:\/|$)|\/socket\.io(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      try {
        const host = new URL(origin).hostname;
        if (host.endsWith('.onrender.com') || host.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // ignore
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  }
});
initChatSocket(io);

const PORT = process.env.PORT || 5000;

ensureDemoData()
  .catch((error) => {
    console.error('Demo data setup failed:', error.message);
  })
  .finally(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`KSTU Counseling API running on http://localhost:${PORT}`);
      console.log(`PeerJS signaling available at http://localhost:${PORT}/peerjs`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process, then run npm run dev:server again.`);
        process.exit(1);
      }
      throw error;
    });
  });
