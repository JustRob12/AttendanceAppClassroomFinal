const db = require('../config/database');

const classController = {
  addClass: async (req, res) => {
    try {
      const { subjectCode, subjectDescription, schedule } = req.body;
      const teacherId = req.user.id; // Get teacher ID from authenticated user

      // Validate input
      if (!subjectCode || !subjectDescription || !schedule) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const query = 'INSERT INTO classes (teacherId, subjectCode, subjectDescription, schedule) VALUES (?, ?, ?, ?)';
      db.query(query, [teacherId, subjectCode, subjectDescription, schedule], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error adding class' });
        }
        res.status(201).json({
          success: true,
          message: 'Class added successfully',
          classId: results.insertId
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getTeacherClasses: async (req, res) => {
    try {
      const teacherId = req.user.id;

      const query = 'SELECT * FROM classes WHERE teacherId = ?';
      db.query(query, [teacherId], (err, results) => {
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
  },

  updateClass: async (req, res) => {
    try {
      const { id } = req.params;
      const { subjectCode, subjectDescription, schedule } = req.body;
      const teacherId = req.user.id;

      // Validate input
      if (!subjectCode || !subjectDescription || !schedule) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Verify teacher owns this class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [id, teacherId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error verifying class ownership' });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: 'Not authorized to modify this class' });
        }

        // Update the class
        const updateQuery = 'UPDATE classes SET subjectCode = ?, subjectDescription = ?, schedule = ? WHERE id = ?';
        db.query(updateQuery, [subjectCode, subjectDescription, schedule, id], (updateErr) => {
          if (updateErr) {
            console.error('Database error:', updateErr);
            return res.status(500).json({ message: 'Error updating class' });
          }
          res.json({ success: true, message: 'Class updated successfully' });
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteClass: async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;

      // Verify teacher owns this class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [id, teacherId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error verifying class ownership' });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: 'Not authorized to delete this class' });
        }

        // Delete the class
        const deleteQuery = 'DELETE FROM classes WHERE id = ?';
        db.query(deleteQuery, [id], (deleteErr) => {
          if (deleteErr) {
            console.error('Database error:', deleteErr);
            return res.status(500).json({ message: 'Error deleting class' });
          }
          res.json({ success: true, message: 'Class deleted successfully' });
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = classController; 