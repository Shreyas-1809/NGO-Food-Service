const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

router.post('/register', async (req, res, next) => {
  try {
    console.log('Signup Request Body:', req.body);
    const { 
      accountType, email, password, phone,
      orgName, city, pincode, address,
      fullName, businessName, businessDetails,
      location 
    } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Account already exists with this email. Please log in.' });

    const userPayload = { 
      accountType, email, password, phone,
      orgName, city, pincode, address,
      fullName, businessName, businessDetails
    };

    if (location && location.coordinates && location.coordinates.length === 2) {
      userPayload.location = location;
    }
    
    user = new User(userPayload);
    await user.save(); // password is automatically hashed in pre-save hook

    // Log activity
    await Activity.create({ userId: user.id, action: 'Account Created' });

    const payload = { user: { id: user.id, accountType: user.accountType } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.orgName || user.fullName, 
          email: user.email, 
          accountType: user.accountType 
        } 
      });
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email. Please sign up first.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    // Log activity
    await Activity.create({ userId: user.id, action: 'Logged In' });

    const payload = { user: { id: user.id, accountType: user.accountType } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.orgName || user.fullName, 
          email: user.email, 
          accountType: user.accountType 
        } 
      });
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    // Add dynamic name property for frontend convenience
    const userObj = user.toObject();
    userObj.name = userObj.orgName || userObj.fullName;
    res.json(userObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
