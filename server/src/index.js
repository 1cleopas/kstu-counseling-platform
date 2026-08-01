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
      if (!origin || clientUrls.includes(origin) || process.env.NODE_ENV !== 'production') {
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
    origin: clientUrls,
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
server.listen(PORT, () => {
  console.log(`KSTU Counseling API running on http://localhost:${PORT}`);
  console.log(`PeerJS signaling available at http://localhost:${PORT}/peerjs`);
});
