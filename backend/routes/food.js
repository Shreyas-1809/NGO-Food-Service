const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Food = require('../models/Food');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

// @route   POST /api/food
// @desc    Create a new food listing
// @access  Private (DONOR only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'DONOR' && req.user.accountType !== 'DONOR') {
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
    if (req.user.role !== 'DONOR' && req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can access their listings' });
    }

    const foods = await Food.find({ donorId: req.user.id })
      .lean()
      .sort({ createdAt: -1 });

    for (let food of foods) {
      if (food.status === 'AVAILABLE') {
        const pendingClaim = await Claim.findOne({ foodId: food._id, status: 'PENDING' });
        if (pendingClaim) {
          food.pendingClaimId = pendingClaim._id;
        }
      }
    }
      
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
// @desc    Request to claim food (NGO only)
// @access  Private
router.post('/:id/claim', auth, async (req, res) => {
  try {
    if (req.user.role !== 'RECEIVER' && req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can claim food' });
    }
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Food not available' });
    }

    // Check if user already has a pending claim for this food
    const existingClaim = await Claim.findOne({ ngoId: req.user.id, foodId: food._id, status: 'PENDING' });
    if (existingClaim) {
      return res.status(400).json({ message: 'You already have a pending claim for this food' });
    }

    const { message, requestedPickupTime } = req.body;

    const newClaim = new Claim({
      ngoId: req.user.id,
      foodId: food._id,
      message,
      requestedPickupTime
    });
    await newClaim.save();

    const notification = new Notification({
      userId: food.donorId,
      type: 'CLAIM_REQUEST',
      relatedClaimId: newClaim._id,
      message: 'Someone wants to claim your food!' // We'll construct full message on frontend or can do it here
    });
    await notification.save();
    
    // We do NOT change the food status here. It remains AVAILABLE until accepted.
    // However, we could emit a socket event to update the LiveFeed if needed.
    // For now, returning the claim.
    res.json(newClaim);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/food/:id
// @desc    Edit a food listing (Donor only)
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'DONOR' && req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can edit food' });
    }
    let food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Cannot edit if already claimed
    if (food.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Cannot edit claimed food' });
    }

    const { title, quantity, foodType, preparedTime, expiryTime, items, overallExpiry, location } = req.body;
    
    if (title) food.title = title;
    if (quantity) food.quantity = quantity;
    if (foodType) food.foodType = foodType;
    if (preparedTime) food.preparedTime = preparedTime;
    if (expiryTime) food.expiryTime = expiryTime;
    if (items) food.items = items;
    if (overallExpiry) food.overallExpiry = overallExpiry;
    if (location) food.location = location;

    await food.save();
    
    const io = req.app.get('io');
    if (io) io.emit('LISTING_UPDATED', food);

    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/food/:id
// @desc    Delete a food listing (Donor only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'DONOR' && req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can delete food' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Cannot delete if already claimed/completed
    if (food.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Cannot delete claimed food' });
    }

    await food.deleteOne();
    
    // Cleanup any pending claims
    await Claim.deleteMany({ foodId: food._id });

    // Emit event
    const io = req.app.get('io');
    // Using a different event name or sending empty obj to clear it from frontend?
    // The easiest is just letting frontend refetch or handle it
    
    res.json({ message: 'Food deleted' });
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
    if (req.user.role !== 'DONOR' && req.user.accountType !== 'DONOR') {
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
    if (req.user.role === 'DONOR' || req.user.accountType === 'DONOR') {
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
