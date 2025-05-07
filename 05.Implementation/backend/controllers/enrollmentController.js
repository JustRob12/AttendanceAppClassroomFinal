const db = require('../config/database');

const enrollmentController = {
  // Get all registered students (for teacher to select from)
  getAvailableStudents: async (req, res) => {
    try {
      const classId = req.params.classId;
      
      // Get students who are not yet enrolled in this class
      const query = `
        SELECT s.id, s.firstName, s.lastName, s.studentId, s.email, s.course 
        FROM students s
        WHERE s.id NOT IN (
          SELECT studentId 
          FROM class_enrollments 
          WHERE classId = ?
        )
      `;
      
      db.query(query, [classId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching available students' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get enrolled students for a specific class
  getEnrolledStudents: async (req, res) => {
    try {
      const classId = req.params.classId;
      const teacherId = req.user.id;

      // First verify if the teacher owns this class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [classId, teacherId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error verifying class ownership' });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: 'Not authorized to view this class' });
        }

        // Get enrolled students
        const enrollmentQuery = `
          SELECT s.id, s.firstName, s.lastName, s.studentId, s.email, s.course, ce.enrollmentDate
          FROM students s
          JOIN class_enrollments ce ON s.id = ce.studentId
          WHERE ce.classId = ?
        `;

        db.query(enrollmentQuery, [classId], (enrollErr, enrollResults) => {
          if (enrollErr) {
            console.error('Database error:', enrollErr);
            return res.status(500).json({ message: 'Error fetching enrolled students' });
          }
          res.json(enrollResults);
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Add students to a class
  enrollStudents: async (req, res) => {
    try {
      const classId = req.params.classId;
      const { studentIds } = req.body; // Array of student IDs to enroll
      const teacherId = req.user.id;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Please provide student IDs to enroll' });
      }

      // Verify teacher owns the class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [classId, teacherId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error verifying class ownership' });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: 'Not authorized to modify this class' });
        }

        // Create enrollment records
        const values = studentIds.map(studentId => [classId, studentId]);
        const enrollQuery = 'INSERT INTO class_enrollments (classId, studentId) VALUES ?';

        db.query(enrollQuery, [values], (enrollErr, enrollResults) => {
          if (enrollErr) {
            console.error('Database error:', enrollErr);
            if (enrollErr.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ message: 'Some students are already enrolled' });
            }
            return res.status(500).json({ message: 'Error enrolling students' });
          }
          res.json({ 
            success: true, 
            message: `Successfully enrolled ${enrollResults.affectedRows} students` 
          });
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Remove a student from a class
  removeStudent: async (req, res) => {
    try {
      const { classId, studentId } = req.params;
      const teacherId = req.user.id;

      // Verify teacher owns the class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [classId, teacherId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error verifying class ownership' });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: 'Not authorized to modify this class' });
        }

        // Remove enrollment
        const removeQuery = 'DELETE FROM class_enrollments WHERE classId = ? AND studentId = ?';
        db.query(removeQuery, [classId, studentId], (removeErr, removeResults) => {
          if (removeErr) {
            console.error('Database error:', removeErr);
            return res.status(500).json({ message: 'Error removing student' });
          }

          if (removeResults.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found in this class' });
          }

          res.json({ success: true, message: 'Student removed successfully' });
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get student's classes
  getStudentClasses: async (req, res) => {
    try {
      const studentId = req.user.id;

      const query = `
        SELECT c.*, t.firstName as teacherFirstName, t.lastName as teacherLastName 
        FROM classes c
        JOIN class_enrollments ce ON c.id = ce.classId
        JOIN teachers t ON c.teacherId = t.id
        WHERE ce.studentId = ?
      `;

      db.query(query, [studentId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching classes' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = enrollmentController; 