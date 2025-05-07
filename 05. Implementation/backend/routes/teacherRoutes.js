const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, checkTeacherRole } = require('../middleware/auth');

// Public routes
router.post('/register', teacherController.register);
router.post('/login', teacherController.login);

// Protected routes - require authentication and teacher role
router.use(authenticateToken);
router.use(checkTeacherRole);

// Profile routes
router.get('/profile', teacherController.getProfile);
router.post('/profile-picture', teacherController.uploadProfilePicture);

// Stats routes
router.get('/total-students', teacherController.getTotalStudents);
router.get('/average-attendance', teacherController.getAverageAttendance);
router.get('/attendance-report', teacherController.getAttendanceReport);

module.exports = router; 