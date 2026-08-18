const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

// Helper to determine effective role
const getEffectiveRole = (user) => {
  if (user.role) return user.role;
  if (user.accountType === 'ORGANISATION') return 'RECEIVER';
  return user.accountType || 'DONOR';
};

router.post('/register', async (req, res, next) => {
  try {
    console.log('Signup Request Body:', req.body);
    const { 
      accountType, role, email, password, phone,
      orgName, city, pincode, address,
      fullName, businessName, businessDetails,
      location 
    } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Account already exists with this email. Please log in.' });

    // Determine normalized role and accountType
    const userRole = role || (accountType === 'ORGANISATION' ? 'RECEIVER' : (accountType || 'DONOR'));
    const userAccountType = accountType || (userRole === 'RECEIVER' ? 'ORGANISATION' : userRole);

    const userPayload = { 
      role: userRole,
      accountType: userAccountType, 
      email, 
      password, 
      phone,
      orgName, 
      city, 
      pincode, 
      address,
      fullName, 
      businessName, 
      businessDetails
    };

    if (location && location.coordinates && location.coordinates.length === 2) {
      userPayload.location = location;
    }
    
    user = new User(userPayload);
    await user.save(); // password is automatically hashed in pre-save hook

    // Log activity
    await Activity.create({ userId: user.id, action: 'Account Created' });
    await Activity.create({ userId: user.id, action: 'Logged In' });

    const effectiveRole = getEffectiveRole(user);
    const payload = { user: { id: user.id, role: effectiveRole, accountType: user.accountType } };
    
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.orgName || user.fullName || user.email, 
          email: user.email, 
          role: effectiveRole,
          accountType: user.accountType,
          phone: user.phone
        } 
      });
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email. Please sign up first.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials. Please check your password.' });

    // Log activity for login history tracking
    await Activity.create({ userId: user.id, action: 'Logged In' });

    const effectiveRole = getEffectiveRole(user);
    const payload = { user: { id: user.id, role: effectiveRole, accountType: user.accountType } };
    
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.orgName || user.fullName || user.email, 
          email: user.email, 
          role: effectiveRole,
          accountType: user.accountType,
          phone: user.phone
        } 
      });
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = user.toObject();
    const effectiveRole = getEffectiveRole(userObj);
    userObj.role = effectiveRole;
    userObj.name = userObj.orgName || userObj.fullName || userObj.email;
    res.json(userObj);
  } catch (err) {
    console.error('Fetch /me Error:', err.message);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

module.exports = router;
