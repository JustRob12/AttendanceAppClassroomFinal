const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkStudentRole } = require('../middleware/auth');

router.post('/register', studentController.register);
router.post('/login', studentController.login);
router.get('/profile', authenticateToken, checkStudentRole, studentController.getProfile);

module.exports = router; 