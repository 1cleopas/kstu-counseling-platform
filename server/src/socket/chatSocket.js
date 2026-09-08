const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { saveMessage } = require('../controllers/chatController');
const { sameId } = require('../utils/ids');

async function canUseConversation(user, conversationId) {
  const conversations = await query('SELECT * FROM conversations WHERE id = :id', { id: conversationId });
  const conv = conversations[0];
  if (!conv) return false;
  if (user.role === 'admin') return true;
  return sameId(user.id, conv.student_id) || sameId(user.id, conv.counselor_id);
}

function initChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('join_conversation', async (conversationId) => {
      if (!(await canUseConversation(socket.user, conversationId))) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, body }, callback) => {
      try {
        if (!conversationId || !body?.trim()) {
          callback?.({ ok: false, message: 'Invalid message' });
          return;
        }
        if (!(await canUseConversation(socket.user, conversationId))) {
          callback?.({ ok: false, message: 'Access denied' });
          return;
        }

        const message = await saveMessage(conversationId, socket.user.id, body.trim());
        io.to(`conversation:${conversationId}`).emit('new_message', message);
        callback?.({ ok: true, message });
      } catch (error) {
        console.error('Socket message error:', error);
        callback?.({ ok: false, message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId: socket.user.id,
        full_name: socket.user.full_name
      });
    });
  });
}

module.exports = { initChatSocket };
