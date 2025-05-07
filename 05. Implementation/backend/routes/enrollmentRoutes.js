const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken, checkTeacherRole, checkStudentRole } = require('../middleware/auth');
const db = require('../config/database');

// Enrollment management routes
// Teacher routes
router.use('/class', authenticateToken, checkTeacherRole);
router.get('/class/:classId/available-students', enrollmentController.getAvailableStudents);
router.get('/class/:classId/enrolled-students', enrollmentController.getEnrolledStudents);
router.post('/class/:classId/enroll', enrollmentController.enrollStudents);
router.delete('/class/:classId/student/:studentId', enrollmentController.removeStudent);

// Student route
router.get('/student/classes', authenticateToken, checkStudentRole, enrollmentController.getStudentClasses);

// Enroll in a class using key code
router.post('/enroll', authenticateToken, checkStudentRole, (req, res) => {
  const { keycode } = req.body;
  const studentId = req.user.id;

  if (!keycode) {
    return res.status(400).json({ message: 'Key code is required' });
  }

  // Find the class with the given key code
  db.query(
    'SELECT c.* FROM classes c JOIN class_keycodes ck ON c.id = ck.classId WHERE ck.keycode = ?',
    [keycode],
    (err, classResult) => {
      if (err) {
        console.error('Error finding class:', err);
        return res.status(500).json({ message: 'Failed to enroll in class' });
      }

      if (classResult.length === 0) {
        return res.status(404).json({ message: 'Invalid key code' });
      }

      const classData = classResult[0];

      // Check if student is already enrolled
      db.query(
        'SELECT * FROM class_enrollments WHERE classId = ? AND studentId = ?',
        [classData.id, studentId],
        (err, enrollmentCheck) => {
          if (err) {
            console.error('Error checking enrollment:', err);
            return res.status(500).json({ message: 'Failed to enroll in class' });
          }

          if (enrollmentCheck.length > 0) {
            return res.status(400).json({ message: 'You are already enrolled in this class' });
          }

          // Enroll the student
          db.query(
            'INSERT INTO class_enrollments (classId, studentId) VALUES (?, ?)',
            [classData.id, studentId],
            (err) => {
              if (err) {
                console.error('Error enrolling student:', err);
                return res.status(500).json({ message: 'Failed to enroll in class' });
              }

              res.status(201).json({ message: 'Successfully enrolled in class' });
            }
          );
        }
      );
    }
  );
});

module.exports = router; 