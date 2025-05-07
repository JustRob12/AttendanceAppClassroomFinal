const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const db = require('../config/database');

const adminController = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if admin already exists
      const [existingAdmin] = await db.promise().query(
        'SELECT * FROM admins WHERE email = ?',
        [email]
      );

      if (existingAdmin.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin
      await db.promise().query(
        'INSERT INTO admins (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword]
      );

      res.status(201).json({ success: true, message: 'Admin registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const [admins] = await db.promise().query(
        'SELECT * FROM admins WHERE email = ?',
        [email]
      );

      if (admins.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const admin = admins[0];
      const validPassword = await bcrypt.compare(password, admin.password);

      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      // Get total students
      const [students] = await db.promise().query('SELECT COUNT(*) as total FROM students');
      // Get total teachers
      const [teachers] = await db.promise().query('SELECT COUNT(*) as total FROM teachers');
      // Get total active classes
      const [classes] = await db.promise().query('SELECT COUNT(*) as total FROM classes');

      res.json({
        totalStudents: students[0].total,
        totalTeachers: teachers[0].total,
        totalClasses: classes[0].total
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllStudents: async (req, res) => {
    try {
      const [students] = await db.promise().query(`
        SELECT s.*, sp.imageUrl as profilePicture 
        FROM students s 
        LEFT JOIN student_profile_pictures sp ON s.id = sp.studentId
        ORDER BY s.created_at DESC
      `);
      res.json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllTeachers: async (req, res) => {
    try {
      const [teachers] = await db.promise().query(`
        SELECT t.*, tp.imageUrl as profilePicture 
        FROM teachers t 
        LEFT JOIN teacher_profile_pictures tp ON t.id = tp.teacherId
        ORDER BY t.created_at DESC
      `);
      res.json(teachers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllClasses: async (req, res) => {
    try {
      const [classes] = await db.promise().query(`
        SELECT c.*, t.firstName as teacherFirstName, t.lastName as teacherLastName,
               COUNT(ce.id) as totalStudents
        FROM classes c
        LEFT JOIN teachers t ON c.teacherId = t.id
        LEFT JOIN class_enrollments ce ON c.id = ce.classId
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      res.json(classes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = adminController; 