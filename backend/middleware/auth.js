const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authentication token provided. Access denied.' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    console.error('Auth middleware error:', e.message);
    res.status(401).json({ message: 'Token is invalid or expired. Please sign in again.' });
  }
};
