const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkStudentRole } = require('../middleware/auth');

router.post('/register', studentController.register);
router.post('/login', studentController.login);
router.get('/profile', authenticateToken, checkStudentRole, studentController.getProfile);
router.post('/profile-picture', authenticateToken, checkStudentRole, studentController.uploadProfilePicture);
router.get('/profile/:studentId', authenticateToken, studentController.getStudentProfile);

module.exports = router; 