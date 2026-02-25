const User = require('../models/user');
const { createTokens } = require('../services/tokenService');
const Token = require('../models/token');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.login = async (req, res) => {
    res.render('login');
};

module.exports.post_login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error('please Enter your email and password');
    }
    
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const validPassword = await bcryptjs.compare(password, foundUser.hashPassword);
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }

    const existingToken = await Token.findOne({ userId: foundUser._id });
    if (existingToken) {
      await Token.findOneAndDelete({ userId: foundUser._id });
    }

    const { accessToken, refreshToken } = createTokens(foundUser._id);

    const newToken = new Token({
      userId: foundUser._id,
      refreshToken,
    });
    await newToken.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 
    });

    // هنا أضف حقل permissions في الرد
    res.status(201).json({ 
      message: "Successful login", 
      accessToken,
      permissions: foundUser.permissions || ['/admin/dashboard'], 
      name: foundUser.name
    });
  } catch (err) {
    next(err);
  }
}

module.exports.createUser = async (req, res) => {
  try {
    const { name, email, password, permissions , role} = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const newUser = new User({
      name,
      email,
      hashPassword: password,
      permissions: Array.isArray(permissions) && permissions.length > 0 
        ? permissions 
        : ['/admin/dashboard'], 
      isVerified: true,
      role
    });

    await newUser.save();

    res.status(201).json({ 
      message: "User created successfully", 
      userId: newUser._id,
    });
  } catch (error) {
     if (error.code === 11000){
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json( {message: `This ${field} is already in use, Please choose a different one`});
    }
    res.status(500).json({ message: `Internal server error: ${error}`});
  }
};

module.exports.current_user = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select('-hashPassword -__v'); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }   
}

module.exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-hashPassword -__v');
    res.json({ users });
  } catch (error) {
    next(error);
  }
};


module.exports.updateUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
   
    const { id } = req.params;
    const { name, email, password, permissions, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ message: "You cannot modify your own account" });
    }

    user.name = name;
    user.email = email;
    user.role = role || user.role;
    user.permissions = Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : user.permissions;
    if (password){
        user.hashPassword = password;
    }
  

    await user.save();

    res.json({ message: "User updated successfully" });
  } catch (error) {
    if (error.code === 11000){
        const field = Object.keys(error.keyValue)[0];
        res.status(400).json( {message: `This ${field} is already in use, Please choose a different one`});
    }
    res.status(500).json({ message: `Internal server error: ${error}`});
  }
};


module.exports.deleteUser = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(403).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({ _id: id });
    await Token.deleteOne({ userId: id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports.refresh_token_post = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        
        const tokenDoc = await Token.findOne({ refreshToken });
        if (!tokenDoc) {
            return res.status(401).json({ message: 'Refresh token is invalid or expired. Please log in again.' });
        }

        const decoded = jwt.verify(refreshToken, process.env.secret);

        const accessToken = jwt.sign({ id: decoded.id }, process.env.secret, {
            expiresIn: '5m'
        });

        const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.secret, {});

        tokenDoc.refreshToken = newRefreshToken;
        tokenDoc.createdAt = new Date(); 
        await tokenDoc.save();
        
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          sameSite: 'Strict',
        });

        return res.json({ accessToken });

    } catch (err) {
      console.log('xxx');
        return res.status(401).json({
            message: 'Refresh token is invalid or expired. Please log in again.'
        });
    }
};

module.exports.logout_post = async (req, res) => {
  try {
    const userId = req.user.id;
    await Token.deleteMany({ userId: userId });

    // حذف كوكيز الـ refreshToken
    res.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'Strict',
      expires: new Date(0),
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during logout', error: err.message });
  }
};

