const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Food = require('../models/Food');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

const User = require('../models/User');

// @route   POST /api/food
// @desc    Create a new food listing
// @access  Private (DONOR only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can post food' });
    }

    const { title, quantity, foodType, preparedTime, expiryTime, items, photos, overallExpiry, location, pickupAddress, pickupTimeSlot, autoDeleteValue, autoDeleteUnit, autoDeleteAt: explicitAutoDeleteAt } = req.body;

    let computedAutoDeleteAt = explicitAutoDeleteAt ? new Date(explicitAutoDeleteAt) : null;
    if (!computedAutoDeleteAt && autoDeleteValue && Number(autoDeleteValue) > 0) {
      const val = Number(autoDeleteValue);
      const hours = autoDeleteUnit === 'DAYS' ? val * 24 : val;
      computedAutoDeleteAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const newFood = new Food({
      donorId: req.user.id,
      title,
      quantity,
      foodType,
      preparedTime,
      expiryTime,
      status: 'AVAILABLE',
      items: items || [],
      photos: photos || [],
      overallExpiry: overallExpiry || expiryTime,
      autoDeleteAt: computedAutoDeleteAt,
      location: location ? { type: 'Point', coordinates: location.coordinates || [0, 0] } : { type: 'Point', coordinates: [0, 0] },
      pickupAddress,
      pickupTimeSlot
    });

    const food = await newFood.save();
    
    // Alert NGOs via socket.io:
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
// @desc    Get current logged-in donor's food listings only (Strictly scoped by donorId at query level)
// @access  Private (DONOR only)
router.get('/my-listings', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can access their listings' });
    }

    // STRICT QUERY-LEVEL SCOPING: Only fetch postings where donorId equals the logged-in user ID
    const foods = await Food.find({ donorId: req.user.id })
      .populate('claimantId', 'orgName fullName phone email address city')
      .lean()
      .sort({ createdAt: -1 });

    const now = new Date();

    // Fetch all claims related to this donor's food postings
    const foodIds = foods.map(f => f._id);
    const allClaims = await Claim.find({ foodId: { $in: foodIds } })
      .populate('ngoId', 'orgName fullName phone email address city location')
      .lean()
      .sort({ createdAt: -1 });

    // Group claims by foodId
    const claimsByFoodId = {};
    for (const claim of allClaims) {
      const fid = claim.foodId.toString();
      if (!claimsByFoodId[fid]) {
        claimsByFoodId[fid] = [];
      }
      claimsByFoodId[fid].push(claim);
    }

    // Process and enrich each food item with its claim lifecycle details & computed status
    for (let food of foods) {
      const fid = food._id.toString();
      const foodClaims = claimsByFoodId[fid] || [];
      food.claims = foodClaims;

      const pendingClaim = foodClaims.find(c => c.status === 'PENDING');
      const acceptedClaim = foodClaims.find(c => c.status === 'ACCEPTED');
      const declinedClaims = foodClaims.filter(c => c.status === 'DECLINED');

      if (pendingClaim) {
        food.pendingClaimId = pendingClaim._id;
        food.pendingClaim = pendingClaim;
      }
      if (acceptedClaim) {
        food.acceptedClaim = acceptedClaim;
      }

      // Determine accurate category state
      const expiryDate = new Date(food.expiryTime || food.overallExpiry || food.createdAt);
      const isExpired = expiryDate <= now;

      if (food.status === 'CLAIMED' || food.status === 'ACCEPTED' || food.status === 'COMPLETED' || acceptedClaim) {
        food.computedStatus = 'ACCEPTED';
      } else if (food.status === 'REJECTED' || food.status === 'DECLINED' || (foodClaims.length > 0 && foodClaims.length === declinedClaims.length)) {
        food.computedStatus = 'REJECTED';
      } else if (isExpired && foodClaims.length === 0) {
        food.computedStatus = 'NON_CLAIMED';
      } else if (!isExpired && (food.status === 'AVAILABLE' || food.status === 'ACTIVE')) {
        food.computedStatus = 'ACTIVE';
      } else if (isExpired && !acceptedClaim) {
        food.computedStatus = 'NON_CLAIMED';
      } else {
        food.computedStatus = food.status;
      }
    }
      
    res.json(foods);
  } catch (err) {
    console.error('Error fetching food listings:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food
// @desc    Get all available food listings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const foods = await Food.find({
      status: { $in: ['AVAILABLE', 'ACTIVE'] },
      $or: [
        { autoDeleteAt: { $exists: false } },
        { autoDeleteAt: null },
        { autoDeleteAt: { $gt: now } }
      ]
    })
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
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can claim food' });
    }
    const food = await Food.findById(req.params.id);
    if (!food || (food.status !== 'AVAILABLE' && food.status !== 'ACTIVE')) {
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

    // Fetch NGO details for real-time notification
    const ngoUser = await User.findById(req.user.id).select('orgName fullName phone email address city');
    const ngoName = ngoUser?.orgName || ngoUser?.fullName || 'Organisation';
    // Format pickup time string safely whether it's HH:mm, ISO date, or text
    let pickupTimeStr = 'Flexible';
    if (requestedPickupTime) {
      if (/^\d{1,2}:\d{2}/.test(requestedPickupTime)) {
        pickupTimeStr = requestedPickupTime;
      } else {
        const parsedDate = new Date(requestedPickupTime);
        pickupTimeStr = !isNaN(parsedDate.getTime()) 
          ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : requestedPickupTime;
      }
    }

    const notification = new Notification({
      userId: food.donorId,
      type: 'CLAIM_REQUEST',
      title: `New Claim Request from ${ngoName}`,
      relatedClaimId: newClaim._id,
      relatedFoodId: food._id,
      message: `${ngoName} requested to claim "${food.title}". Pickup: ${pickupTimeStr}.${message ? ` "${message}"` : ''}`,
      stage: 'Awaiting your decision'
    });
    await notification.save();
    
    // Send real-time Socket.io notification — targeted to the donor's room only
    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      const populatedClaim = await Claim.findById(newClaim._id)
        .populate('ngoId', 'orgName fullName phone email address city')
        .populate('foodId');

      // Targeted: only the donor receives this event
      emitToUser(food.donorId, 'CLAIM_REQUEST_RECEIVED', {
        donorId: food.donorId.toString(),
        claim: populatedClaim || newClaim,
        ngo: ngoUser,
        ngoName,
        foodTitle: food.title,
        foodId: food._id,
        requestedPickupTime,
        message: message || '',
        notification
      });

      emitToUser(food.donorId, 'NEW_NOTIFICATION', {
        ...notification.toObject(),
        userId: food.donorId.toString(),
        ngoName,
        foodTitle: food.title,
        claimId: newClaim._id
      });

      // Broadcast listing update to all NGOs browsing the feed (public event, not private)
      req.app.get('io').emit('LISTING_UPDATED', food);
    }

    res.json(newClaim);
  } catch (err) {
    console.error('Error claiming food:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PATCH /api/food/:id
// @desc    Edit a food listing (Donor only)
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
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

    // Enforce 12-hour edit restriction rule
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - new Date(food.createdAt).getTime();
    if (timeElapsed > TWELVE_HOURS_MS) {
      return res.status(403).json({ message: 'Editing is only allowed within 12 hours of creation.' });
    }

    const { title, quantity, foodType, preparedTime, expiryTime, items, photos, overallExpiry, location, pickupAddress, pickupTimeSlot } = req.body;
    
    if (title) food.title = title;
    if (quantity) food.quantity = quantity;
    if (foodType) food.foodType = foodType;
    if (preparedTime) food.preparedTime = preparedTime;
    if (expiryTime) food.expiryTime = expiryTime;
    if (items) food.items = items;
    if (photos !== undefined) food.photos = photos; // Allow empty array to clear photos
    if (overallExpiry) food.overallExpiry = overallExpiry;
    if (location) {
      food.location = {
        type: 'Point',
        coordinates: location.coordinates || food.location?.coordinates || [0, 0]
      };
    } else if (food.location && !food.location.type) {
      // Fix existing documents with malformed GeoJSON (missing type)
      food.location = {
        type: 'Point',
        coordinates: food.location.coordinates || [0, 0]
      };
    }
    if (pickupAddress) food.pickupAddress = pickupAddress;
    if (pickupTimeSlot) food.pickupTimeSlot = pickupTimeSlot;

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
    if (req.user.accountType !== 'DONOR') {
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

    // Notify both donor and NGO of completed delivery
    const emitToUser = req.app.get('emitToUser');
    const io = req.app.get('io');

    try {
      // Find the accepted claim to know the NGO
      const acceptedClaim = await Claim.findOne({ foodId: food._id, status: 'ACCEPTED' });
      if (acceptedClaim && emitToUser) {
        // Notify NGO — pickup completed
        const ngoPickupNotif = new Notification({
          userId: acceptedClaim.ngoId,
          type: 'PICKUP_CONFIRMED',
          title: 'Pickup Completed ✓',
          message: `Pickup of "${food.title}" has been verified and completed. Thank you!`,
          relatedClaimId: acceptedClaim._id,
          relatedFoodId: food._id,
          stage: 'Delivered ✓'
        });
        await ngoPickupNotif.save();
        emitToUser(acceptedClaim.ngoId, 'PICKUP_CONFIRMED', { food, claim: acceptedClaim });
        emitToUser(acceptedClaim.ngoId, 'NEW_NOTIFICATION', {
          ...ngoPickupNotif.toObject(),
          userId: acceptedClaim.ngoId.toString()
        });

        // Update stage on NGO's existing CLAIM_ACCEPTED notification
        await Notification.findOneAndUpdate(
          { relatedClaimId: acceptedClaim._id, userId: acceptedClaim.ngoId, type: 'CLAIM_ACCEPTED' },
          { stage: 'Delivered ✓' }
        );
      }
    } catch (notifErr) {
      console.error('Error creating pickup notifications:', notifErr.message);
    }

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

module.exports = router;
