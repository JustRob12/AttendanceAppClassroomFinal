const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth');

// Protected routes
router.use(auth.authenticateToken);
router.use(auth.checkTeacherRole);

// Class management routes
router.post('/', classController.createClass);
router.get('/', classController.getClasses);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);
router.post('/:id/generate-keycode', classController.generateKeyCode);

module.exports = router; 