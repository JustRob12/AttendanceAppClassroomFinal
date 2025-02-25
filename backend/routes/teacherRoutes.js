const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, checkTeacherRole } = require('../middleware/auth');

router.post('/register', teacherController.register);
router.post('/login', teacherController.login);
router.get('/profile', authenticateToken, checkTeacherRole, teacherController.getProfile);
router.post('/profile-picture', authenticateToken, checkTeacherRole, teacherController.uploadProfilePicture);

module.exports = router; 