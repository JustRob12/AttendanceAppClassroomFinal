const db = require('../config/database');
const { validationResult } = require('express-validator');

const classController = {
  createClass: async (req, res) => {
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

  getClasses: async (req, res) => {
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
  },

  // Generate a random key code
  generateRandomCode: () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  },

  // Generate or update key code for a class
  generateKeyCode: async (req, res) => {
    try {
      const classId = req.params.id;
      const teacherId = req.user.id;

      // Verify the class belongs to the teacher
      db.query(
        'SELECT id FROM classes WHERE id = ? AND teacherId = ?',
        [classId, teacherId],
        (err, results) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error verifying class ownership' });
          }

          if (results.length === 0) {
            return res.status(404).json({ message: 'Class not found or unauthorized' });
          }

          // Generate a new key code
          const keycode = classController.generateRandomCode();

          // Update or insert the key code
          db.query(
            `INSERT INTO class_keycodes (classId, keycode) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE 
             keycode = VALUES(keycode),
             updated_at = CURRENT_TIMESTAMP`,
            [classId, keycode],
            (err, results) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Error generating key code' });
              }
              res.json({ keycode });
            }
          );
        }
      );
    } catch (error) {
      console.error('Error generating key code:', error);
      res.status(500).json({ message: 'Error generating key code' });
    }
  }
};

module.exports = classController; 