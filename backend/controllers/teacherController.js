const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../config/constants');

const teacherController = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, phoneNumber } = req.body;
      
      console.log('Registration attempt:', { firstName, lastName, email, phoneNumber });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const query = 'INSERT INTO teachers (firstName, lastName, email, password, phoneNumber) VALUES (?, ?, ?, ?, ?)';
      db.query(query, [firstName, lastName, email, hashedPassword, phoneNumber], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Error registering teacher' });
        }
        res.status(201).json({ success: true, message: 'Teacher registered successfully' });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const query = 'SELECT * FROM teachers WHERE email = ?';
      db.query(query, [email], async (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        
        if (results.length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const teacher = results[0];
        const isValidPassword = await bcrypt.compare(password, teacher.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
          { 
            id: teacher.id, 
            email: teacher.email,
            role: 'teacher'
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
    const query = 'SELECT id, firstName, lastName, email, phoneNumber FROM teachers WHERE id = ?';
    db.query(query, [req.user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      res.json(results[0]);
    });
  }
};

module.exports = teacherController; 