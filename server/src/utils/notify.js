const { query } = require('../config/db');

async function createNotification(userId, title, body, type = 'info') {
  await query(
    `INSERT INTO notifications (user_id, title, body, type) VALUES (:userId, :title, :body, :type)`,
    { userId, title, body, type }
  );
}

module.exports = { createNotification };
