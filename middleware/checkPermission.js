const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const Token = require('../models/token.js');

const checkPermission = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.redirect('/admin/login');
    }

    const storedToken = await Token.findOne({ refreshToken });
    if (!storedToken) {
      return res.redirect('/admin/login');
    }

    let userData;
    try {
      userData = jwt.verify(refreshToken, process.env.secret);
    } catch (err) {
      return res.redirect('/admin/login');
    }

    const userId = userData.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/admin/login');
    }

    const requestedPath = req.path;
    if (!user.permissions.includes(requestedPath)) {
      return res.status(403).send("You do not have permission to access this page.");
    }

    next();

  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error.");
  }
};

module.exports = checkPermission;
