const express = require('express');
const {
  listConversations,
  getOrCreateConversation,
  getMessages
} = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/conversations', listConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:id/messages', getMessages);

module.exports = router;
