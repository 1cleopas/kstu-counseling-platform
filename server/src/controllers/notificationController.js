const { query } = require('../config/db');

async function listNotifications(req, res) {
  try {
    const notifications = await query(
      `SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 50`,
      { userId: req.user.id }
    );
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load notifications' });
  }
}

async function markRead(req, res) {
  try {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :userId`,
      { id: req.params.id, userId: req.user.id }
    );
    return res.json({ message: 'Marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update notification' });
  }
}

async function markAllRead(req, res) {
  try {
    await query(`UPDATE notifications SET is_read = 1 WHERE user_id = :userId`, {
      userId: req.user.id
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update notifications' });
  }
}

module.exports = { listNotifications, markRead, markAllRead };
