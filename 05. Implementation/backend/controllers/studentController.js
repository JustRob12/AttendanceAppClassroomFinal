const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET, apiUrl } = require('../config/constants');
const multer = require('multer');
const path = require('path');

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
    const query = `
      SELECT s.id, s.firstName, s.lastName, s.email, s.studentId, s.course, 
             CONCAT('${apiUrl}', pp.imageUrl) as profilePicture
      FROM students s
      LEFT JOIN student_profile_pictures pp ON s.id = pp.studentId
      WHERE s.id = ?
    `;
    db.query(query, [req.user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(results[0]);
    });
  },

  uploadProfilePicture: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      try {
        const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;
        
        const query = `
          INSERT INTO student_profile_pictures (studentId, imageUrl) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE imageUrl = ?
        `;
        
        db.query(query, [req.user.id, imageUrl, imageUrl], (error) => {
          if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Error saving profile picture' });
          }
          res.json({ imageUrl: `${apiUrl}${imageUrl}` });
        });
      } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
  },

  getStudentProfile: async (req, res) => {
    const { studentId } = req.params;
    const query = `
      SELECT s.id, s.firstName, s.lastName, s.email, s.studentId, s.course, 
             CONCAT('${apiUrl}', pp.imageUrl) as profilePicture
      FROM students s
      LEFT JOIN student_profile_pictures pp ON s.id = pp.studentId
      WHERE s.studentId = ?
    `;
    
    db.query(query, [studentId], (err, results) => {
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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/profile-pictures',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file'));
    }
  }
}).single('profilePicture');

module.exports = studentController; 