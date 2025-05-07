const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET, apiUrl } = require('../config/constants');
const multer = require('multer');
const path = require('path');

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
      
      const [teachers] = await db.promise().query('SELECT * FROM teachers WHERE email = ?', [email]);
      
      if (teachers.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const teacher = teachers[0];
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getProfile: async (req, res) => {
    const query = `
      SELECT t.id, t.firstName, t.lastName, t.email, t.phoneNumber,
             CONCAT('${apiUrl}', pp.imageUrl) as profilePicture
      FROM teachers t
      LEFT JOIN teacher_profile_pictures pp ON t.id = pp.teacherId
      WHERE t.id = ?
    `;
    
    db.query(query, [req.user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
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
          INSERT INTO teacher_profile_pictures (teacherId, imageUrl) 
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

  getTotalStudents: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      const query = `
        SELECT COUNT(DISTINCT ce.studentId) as totalStudents
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.classId
        WHERE c.teacherId = ?
      `;

      db.query(query, [teacherId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching total students' });
        }
        res.json({ totalStudents: results[0].totalStudents });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAverageAttendance: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      const query = `
        SELECT 
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as averageAttendance
        FROM classes c
        JOIN attendance a ON c.id = a.classId
        WHERE c.teacherId = ?
      `;

      db.query(query, [teacherId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching average attendance' });
        }
        res.json({ averageAttendance: results[0].averageAttendance || 0 });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAttendanceReport: async (req, res) => {
    try {
      // First, get all classes for the teacher
      const classesQuery = `
        SELECT DISTINCT
          c.id as classId,
          c.subjectCode,
          c.subjectDescription,
          c.schedule,
          (
            SELECT COUNT(DISTINCT ce2.studentId)
            FROM class_enrollments ce2
            WHERE ce2.classId = c.id
          ) as totalEnrolled
        FROM classes c
        WHERE c.teacherId = ?
      `;

      const [classes] = await db.promise().query(classesQuery, [req.user.id]);
      
      // For each class, get the attendance records
      const groupedResults = {};
      
      for (const classInfo of classes) {
        const attendanceQuery = `
          SELECT 
            DATE_FORMAT(a.date, '%Y-%m-%d') as date,
            TIME_FORMAT(a.time, '%H:%i:%s') as time,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as presentStudents,
            GROUP_CONCAT(
              CASE 
                WHEN a.status = 'present' THEN
                  CONCAT(s.studentId, ':', s.firstName, ' ', s.lastName)
              END
            ) as presentStudents
          FROM attendance a
          LEFT JOIN students s ON a.studentId = s.id
          WHERE a.classId = ?
          GROUP BY a.date, a.time
          ORDER BY a.date DESC, a.time DESC
        `;

        const [attendanceRecords] = await db.promise().query(attendanceQuery, [classInfo.classId]);

        const processedRecords = attendanceRecords.map(record => {
          let presentStudentDetails = [];
          if (record.presentStudents) {
            presentStudentDetails = record.presentStudents
              .split(',')
              .filter(Boolean)
              .map(student => {
                const [studentId, name] = student.split(':');
                return { studentId, name };
              });
          }

          return {
            date: record.date,
            time: record.time,
            totalStudents: classInfo.totalEnrolled,
            presentStudents: record.presentStudents || 0,
            attendancePercentage: classInfo.totalEnrolled 
              ? Math.round((record.presentStudents / classInfo.totalEnrolled) * 100) 
              : 0,
            presentStudentDetails
          };
        });

        groupedResults[classInfo.subjectCode] = {
          subjectCode: classInfo.subjectCode,
          subjectDescription: classInfo.subjectDescription,
          schedule: classInfo.schedule,
          totalStudents: classInfo.totalEnrolled,
          attendanceRecords: processedRecords
        };
      }

      console.log('Processed results:', JSON.stringify(groupedResults, null, 2));
      res.json(Object.values(groupedResults));
    } catch (error) {
      console.error('Error getting attendance report:', error);
      res.status(500).json({ message: 'Error getting attendance report' });
    }
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

module.exports = teacherController; 