const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

const auth = {
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  },

  checkTeacherRole: (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }
    next();
  },

  checkStudentRole: (req, res, next) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }
    next();
  },

  checkAdminRole: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
  }
};

module.exports = auth; 