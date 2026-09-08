const express = require('express');
const { studentSummary, monthlyReport, yearlyReport } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('counselor', 'admin'));
router.get('/monthly', monthlyReport);
router.get('/yearly', yearlyReport);
router.get('/clients/:id', studentSummary);

module.exports = router;
