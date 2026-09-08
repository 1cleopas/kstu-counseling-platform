const { query } = require('../config/db');
const { sameId } = require('../utils/ids');

async function listConversations(req, res) {
  try {
    let sql = `
      SELECT conv.*,
        s.full_name AS student_name,
        c.full_name AS counselor_name,
        (SELECT body FROM messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
      FROM conversations conv
      JOIN users s ON s.id = conv.student_id
      JOIN users c ON c.id = conv.counselor_id
    `;
    const params = {};

    if (req.user.role === 'student') {
      sql += ' WHERE conv.student_id = :userId';
      params.userId = req.user.id;
    } else if (req.user.role === 'counselor') {
      sql += ' WHERE conv.counselor_id = :userId';
      params.userId = req.user.id;
    }

    sql += ' ORDER BY COALESCE(last_message_at, conv.created_at) DESC';
    const conversations = await query(sql, params);
    return res.json({ conversations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load conversations' });
  }
}

async function getOrCreateConversation(req, res) {
  try {
    const { counselor_id, student_id } = req.body;
    let studentId;
    let counselorId;

    if (req.user.role === 'student') {
      studentId = req.user.id;
      counselorId = counselor_id;
    } else if (req.user.role === 'counselor') {
      counselorId = req.user.id;
      studentId = student_id;
    } else {
      studentId = student_id;
      counselorId = counselor_id;
    }

    if (!studentId || !counselorId) {
      return res.status(400).json({ message: 'Student and counselor are required' });
    }

    const existing = await query(
      `SELECT * FROM conversations WHERE student_id = :studentId AND counselor_id = :counselorId`,
      { studentId, counselorId }
    );

    if (existing.length) {
      return res.json({ conversation: existing[0] });
    }

    const result = await query(
      `INSERT INTO conversations (student_id, counselor_id) VALUES (:studentId, :counselorId)`,
      { studentId, counselorId }
    );

    const created = await query('SELECT * FROM conversations WHERE id = :id', { id: result.insertId });
    return res.status(201).json({ conversation: created[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not open conversation' });
  }
}

async function getMessages(req, res) {
  try {
    const conversationId = req.params.id;
    const conversations = await query('SELECT * FROM conversations WHERE id = :id', { id: conversationId });
    if (!conversations.length) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conv = conversations[0];
    if (
      req.user.role !== 'admin' &&
      !sameId(req.user.id, conv.student_id) &&
      !sameId(req.user.id, conv.counselor_id)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await query(
      `SELECT m.*, u.full_name AS sender_name, u.role AS sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = :id
       ORDER BY m.created_at ASC`,
      { id: conversationId }
    );

    await query(
      `UPDATE messages SET is_read = 1
       WHERE conversation_id = :id AND sender_id != :userId`,
      { id: conversationId, userId: req.user.id }
    );

    return res.json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load messages' });
  }
}

async function saveMessage(conversationId, senderId, body) {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES (:conversationId, :senderId, :body)`,
    { conversationId, senderId, body }
  );
  const rows = await query(
    `SELECT m.*, u.full_name AS sender_name, u.role AS sender_role
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.id = :id`,
    { id: result.insertId }
  );
  return rows[0];
}

module.exports = {
  listConversations,
  getOrCreateConversation,
  getMessages,
  saveMessage
};
