const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken, checkTeacherRole, checkStudentRole } = require('../middleware/auth');

// Enrollment management routes
// Teacher routes
router.use('/class', authenticateToken, checkTeacherRole);
router.get('/class/:classId/available-students', enrollmentController.getAvailableStudents);
router.get('/class/:classId/enrolled-students', enrollmentController.getEnrolledStudents);
router.post('/class/:classId/enroll', enrollmentController.enrollStudents);
router.delete('/class/:classId/student/:studentId', enrollmentController.removeStudent);

// Student route
router.get('/student/classes', authenticateToken, checkStudentRole, enrollmentController.getStudentClasses);

module.exports = router; 