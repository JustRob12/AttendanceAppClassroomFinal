const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, checkTeacherRole, checkStudentRole } = require('../middleware/auth');

// Teacher routes
router.post('/mark', authenticateToken, checkTeacherRole, attendanceController.markAttendance);
router.get('/class/:classId/today', authenticateToken, checkTeacherRole, attendanceController.getTodayAttendance);

// Student route
router.get('/student/class/:classId', authenticateToken, checkStudentRole, attendanceController.getStudentClassAttendance);

module.exports = router; 