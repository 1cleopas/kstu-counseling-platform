const express = require('express');
const {
  listAppointments,
  createAppointment,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', listAppointments);
router.post('/', authorize('student'), createAppointment);
router.patch('/:id/status', authorize('student', 'counselor', 'admin'), updateAppointmentStatus);

module.exports = router;
