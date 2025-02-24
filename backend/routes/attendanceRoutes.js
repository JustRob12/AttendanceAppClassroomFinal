const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, checkTeacherRole } = require('../middleware/auth');

router.use(authenticateToken, checkTeacherRole);

router.post('/mark', attendanceController.markAttendance);
router.get('/class/:classId/today', attendanceController.getTodayAttendance);

module.exports = router; 