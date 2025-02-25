const db = require('../config/database');

const attendanceController = {
  markAttendance: async (req, res) => {
    try {
      const { classId, studentId, status } = req.body;
      const teacherId = req.user.id;

      // Verify teacher owns the class
      const verifyQuery = 'SELECT * FROM classes WHERE id = ? AND teacherId = ?';
      db.query(verifyQuery, [classId, teacherId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(403).json({ message: 'Not authorized' });
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];

        const query = `
          INSERT INTO attendance (classId, studentId, status, date, time)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status = ?, time = ?
        `;

        db.query(
          query,
          [classId, studentId, status, date, time, status, time],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error marking attendance' });
            }
            res.json({ success: true, message: 'Attendance marked successfully' });
          }
        );
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getTodayAttendance: async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const query = `
        SELECT a.* FROM attendance a
        JOIN classes c ON a.classId = c.id
        WHERE c.id = ? AND c.teacherId = ? AND a.date = ?
      `;

      db.query(query, [classId, teacherId, today], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching attendance' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getStudentClassAttendance: async (req, res) => {
    const { classId } = req.params;
    const studentId = req.user.id;

    const query = `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, status
      FROM attendance
      WHERE classId = ? AND studentId = ?
      ORDER BY date ASC
    `;

    db.query(query, [classId, studentId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error fetching attendance' });
      }
      // console.log('Attendance results:', results);
      res.json(results);
    });
  }
};

module.exports = attendanceController; 