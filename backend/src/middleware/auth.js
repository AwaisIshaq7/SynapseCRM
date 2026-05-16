const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token on protected routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized - user not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token expired — please log in again' });
  }
};

// Restrict route to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};
