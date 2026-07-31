const express = require('express');
const {
  listClients,
  getClient,
  updateClient,
  addSessionRecord
} = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('counselor', 'admin', 'student'), listClients);
router.get('/:id', authorize('counselor', 'admin', 'student'), getClient);
router.put('/:id', authorize('counselor', 'admin'), updateClient);
router.post('/:id/sessions', authorize('counselor', 'admin'), addSessionRecord);

module.exports = router;
