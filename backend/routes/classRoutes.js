const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, checkTeacherRole } = require('../middleware/auth');

// Apply authentication and teacher role check to all routes
router.use(authenticateToken, checkTeacherRole);

// Class management routes
router.post('/', classController.addClass);
router.get('/', classController.getTeacherClasses);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

module.exports = router; 