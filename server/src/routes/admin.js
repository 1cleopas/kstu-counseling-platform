const express = require('express');
const {
  dashboard,
  listUsers,
  createUser,
  setUserActive,
  setUserPassword,
  listCounselors
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/counselors', authenticate, listCounselors);
router.get('/dashboard', authenticate, authorize('admin'), dashboard);
router.get('/users', authenticate, authorize('admin'), listUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.patch('/users/:id/active', authenticate, authorize('admin'), setUserActive);
router.patch('/users/:id/password', authenticate, authorize('admin'), setUserPassword);

module.exports = router;
