const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Food = require('../models/Food');

// @route   POST /api/food
// @desc    Create a new food listing
// @access  Private (DONOR only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can post food' });
    }

    const { title, quantity, foodType, preparedTime, expiryTime, items, overallExpiry, location, pickupAddress, pickupTimeSlot } = req.body;

    const newFood = new Food({
      donorId: req.user.id,
      title,
      quantity,
      foodType,
      preparedTime,
      expiryTime,
      items: items || [],
      overallExpiry: overallExpiry || expiryTime,
      location: location || { coordinates: [0, 0] }, // default if not provided
      pickupAddress,
      pickupTimeSlot
    });

    const food = await newFood.save();
    
    // If you want to emit via socket.io to alert NGOs:
    const io = req.app.get('io');
    if (io) {
      io.emit('NEW_FOOD_LISTING', food);
    }

    res.json(food);
  } catch (err) {
    console.error('Error posting food:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food/my-listings
// @desc    Get current donor's food listings
// @access  Private (DONOR only)
router.get('/my-listings', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can access their listings' });
    }

    const foods = await Food.find({ donorId: req.user.id })
      .sort({ createdAt: -1 });
      
    res.json(foods);
  } catch (err) {
    console.error('Error fetching food listings:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// @route   GET /api/food
// @desc    Get all available food listings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const foods = await Food.find({ status: 'AVAILABLE' })
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails')
      .sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    console.error('Error fetching foods:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/food/:id/claim
// @desc    Claim food (NGO only)
// @access  Private
router.post('/:id/claim', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can claim food' });
    }
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Food not available' });
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    food.status = 'CLAIMED';
    food.claimantId = req.user.id;
    food.verificationCode = code;
    await food.save();
    
    const io = req.app.get('io');
    if (io) io.emit('LISTING_UPDATED', food);
    
    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/food/verify-pickup/:id
// @desc    Verify pickup code (Donor only)
// @access  Private
router.patch('/verify-pickup/:id', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can verify pickups' });
    }
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'CLAIMED') {
      return res.status(400).json({ message: 'Invalid food status' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (food.verificationCode !== req.body.code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    food.status = 'COMPLETED';
    await food.save();
    
    const io = req.app.get('io');
    if (io) io.emit('LISTING_UPDATED', food);
    
    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food/active-pickups
// @desc    Get active claimed pickups for the user
// @access  Private
router.get('/active-pickups', auth, async (req, res) => {
  try {
    let query = { status: 'CLAIMED' };
    if (req.user.accountType === 'DONOR') {
      query.donorId = req.user.id;
    } else {
      query.claimantId = req.user.id;
    }
    const foods = await Food.find(query)
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails')
      .populate('claimantId', 'orgName fullName phone email address city')
      .sort({ updatedAt: -1 });
    res.json(foods);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
