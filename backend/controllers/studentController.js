const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../config/constants');

const studentController = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, studentId, email, course, password } = req.body;
      
      console.log('Student Registration attempt:', { firstName, lastName, studentId, email, course });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const query = 'INSERT INTO students (firstName, lastName, studentId, email, course, password) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(query, [firstName, lastName, studentId, email, course, hashedPassword], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('studentId')) {
              return res.status(400).json({ message: 'Student ID already exists' });
            }
            return res.status(400).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Error registering student' });
        }
        res.status(201).json({ success: true, message: 'Student registered successfully' });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const query = 'SELECT * FROM students WHERE email = ?';
      db.query(query, [email], async (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        
        if (results.length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const student = results[0];
        const isValidPassword = await bcrypt.compare(password, student.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
          { 
            id: student.id, 
            email: student.email,
            role: 'student'
          },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        res.json({ token });
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getProfile: async (req, res) => {
    const query = 'SELECT id, firstName, lastName, email, studentId, course FROM students WHERE id = ?';
    db.query(query, [req.user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(results[0]);
    });
  }
};

module.exports = studentController; 