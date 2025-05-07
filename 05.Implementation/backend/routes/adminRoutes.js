const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protected routes
router.use(auth.authenticateToken);
router.use(auth.checkAdminRole);

// Dashboard routes
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/students', adminController.getAllStudents);
router.get('/teachers', adminController.getAllTeachers);
router.get('/classes', adminController.getAllClasses);

module.exports = router; 