const jwt = require('jsonwebtoken');
const Token = require('../models/token'); // تأكد من مسار الموديل الصحيح

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.secret);
    req.user = decoded;

    const userId = decoded.id;
    const refreshTokenExists = await Token.exists({ userId });

    if (!refreshTokenExists) {
      return res.status(401).json({ message: 'User logged out' });
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = isAuth;
