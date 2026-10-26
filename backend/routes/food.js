const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Food = require('../models/Food');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { generateTokensForFood, buildConfirmationUrls } = require('../utils/confirmationTokens');
const { geocodeAddressBackend } = require('../utils/geocoder');

// @route   POST /api/food
// @desc    Create a new food listing
// @access  Private (DONOR only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can post food' });
    }

    const {
      title, quantity, foodType, preparedTime, expiryTime, items, photos,
      overallExpiry, location, pickupAddress, pickupTimeSlot, autoDeleteValue,
      autoDeleteUnit, autoDeleteAt: explicitAutoDeleteAt,
      requirementId, needId
    } = req.body;

    const targetNeedId = requirementId || needId;
    let validatedNeed = null;
    let targetOrgId = null;
    let donationVisibility = 'PUBLIC';
    let initialStatus = 'AVAILABLE';

    if (targetNeedId) {
      const Need = require('../models/Need');
      validatedNeed = await Need.findById(targetNeedId);
      if (!validatedNeed) {
        return res.status(404).json({ message: 'Referenced requirement/need not found' });
      }
      // Security: Target organisation ID is COPIED strictly from the requirement's owner on the backend
      targetOrgId = validatedNeed.ngoId;
      donationVisibility = 'TARGETED';
      initialStatus = 'PENDING';
    }

    let computedAutoDeleteAt = explicitAutoDeleteAt ? new Date(explicitAutoDeleteAt) : null;
    if (!computedAutoDeleteAt && autoDeleteValue && Number(autoDeleteValue) > 0) {
      const val = Number(autoDeleteValue);
      const hours = autoDeleteUnit === 'DAYS' ? val * 24 : val;
      computedAutoDeleteAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    let finalLocation = location ? { type: 'Point', coordinates: location.coordinates || [0, 0] } : { type: 'Point', coordinates: [0, 0] };
    const hasValidCoords = Array.isArray(finalLocation.coordinates) &&
      finalLocation.coordinates.length >= 2 &&
      Number.isFinite(Number(finalLocation.coordinates[0])) &&
      Number.isFinite(Number(finalLocation.coordinates[1])) &&
      !(Math.abs(Number(finalLocation.coordinates[0])) < 1e-6 && Math.abs(Number(finalLocation.coordinates[1])) < 1e-6);

    if (!hasValidCoords) {
      let addressToGeocode = pickupAddress;
      if (!addressToGeocode) {
        const donorUser = await User.findById(req.user.id).select('address city');
        addressToGeocode = [donorUser?.address, donorUser?.city].filter(Boolean).join(', ');
      }
      if (addressToGeocode) {
        try {
          const geoResult = await geocodeAddressBackend(addressToGeocode);
          if (geoResult && Number.isFinite(geoResult.lat) && Number.isFinite(geoResult.lng)) {
            finalLocation = {
              type: 'Point',
              coordinates: [geoResult.lng, geoResult.lat]
            };
          }
        } catch (geoErr) {
          console.warn('Backend geocoding failed on food post:', geoErr.message);
        }
      }
    }

    const newFood = new Food({
      donorId: req.user.id,
      title,
      quantity,
      foodType,
      preparedTime,
      expiryTime,
      status: initialStatus,
      visibility: donationVisibility,
      targetOrganisationId: targetOrgId,
      targetNgoId: targetOrgId,
      requirementId: validatedNeed ? validatedNeed._id : undefined,
      fulfilledNeedId: validatedNeed ? validatedNeed._id : undefined,
      items: items || [],
      photos: photos || [],
      overallExpiry: overallExpiry || expiryTime,
      autoDeleteAt: computedAutoDeleteAt,
      location: finalLocation,
      pickupAddress,
      pickupTimeSlot
    });

    const food = await newFood.save();

    // Link the need if this is a targeted donation fulfilling a requirement
    if (validatedNeed) {
      validatedNeed.fulfilledFoodId = food._id;
      validatedNeed.donorId = req.user.id;
      if (validatedNeed.status === 'ACTIVE') {
        validatedNeed.status = 'CLAIMED';
        validatedNeed.claimedAt = new Date();
      }
      await validatedNeed.save();
    }

    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');

    if (donationVisibility === 'TARGETED' && targetOrgId) {
      // Create a private notification specifically for the target organisation
      const donorUser = await User.findById(req.user.id).select('fullName orgName phone email');
      const donorName = donorUser?.fullName || donorUser?.orgName || 'A donor';
      const notification = new Notification({
        userId: targetOrgId,
        type: 'INFO',
        title: `Targeted Donation Received for "${validatedNeed.title}"`,
        message: `${donorName} offered food donation "${title}" (${quantity} ${items?.[0]?.unit || 'servings'}) specifically for your shortage requirement "${validatedNeed.title}".`,
        relatedFoodId: food._id,
        stage: 'Awaiting your review'
      });
      await notification.save();

      // STRICT PRIVATE REALTIME EMIT: emit ONLY to the target organisation's room and donor's room
      if (emitToUser) {
        emitToUser(targetOrgId, 'TARGETED_DONATION_RECEIVED', food);
        emitToUser(targetOrgId, 'NEW_NOTIFICATION', {
          ...notification.toObject(),
          foodId: food
        });
        emitToUser(req.user.id, 'DONATION_CREATED', food);
      }
      if (io && validatedNeed) {
        // Notify of need update so other donors see it as claimed
        io.emit('NEED_UPDATED', validatedNeed);
      }
    } else {
      // PUBLIC SURPLUS: Broadcast to open Surplus Feed
      if (io) {
        io.emit('NEW_FOOD_LISTING', food);
      }
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
    // Exclude soft-deleted (owner-hidden) postings from the dashboard view.
    const foods = await Food.find({ donorId: req.user.id, deletedByOwner: { $ne: true } })
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails location')
      .populate('claimantId', 'orgName fullName phone email address city location')
      .populate('targetOrganisationId', 'orgName fullName phone email address city location')
      .populate('targetNgoId', 'orgName fullName phone email address city location')
      .populate('requirementId')
      .populate('fulfilledNeedId')
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

      if (food.status === 'COMPLETED') {
        food.computedStatus = 'COMPLETED';
      } else if (food.status === 'CLAIMED' || food.status === 'ACCEPTED' || acceptedClaim) {
        food.computedStatus = 'ACCEPTED';
      } else if (food.status === 'CANCELLED' || food.status === 'REJECTED' || food.status === 'DECLINED' || (foodClaims.length > 0 && foodClaims.length === declinedClaims.length)) {
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

// @route   GET /api/food/incoming
// @desc    Get targeted donations for current organisation
// @access  Private (Organisation only)
router.get('/incoming', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION' && req.user.accountType !== 'ORGANIZATION') {
      return res.status(403).json({ message: 'Only organisations can access incoming targeted donations' });
    }

    const donations = await Food.find({
      $or: [
        { targetOrganisationId: req.user.id },
        { targetNgoId: req.user.id }
      ],
      visibility: 'TARGETED'
    })
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails location')
      .populate('fulfilledNeedId')
      .populate('requirementId')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    console.error('Error fetching incoming targeted donations:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food
// @desc    Get all available public surplus food listings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    // Rule: The Surplus Feed shows only PUBLIC (untargeted) surplus and non-expired items
    const query = {
      status: { $in: ['AVAILABLE', 'ACTIVE'] },
      visibility: { $ne: 'TARGETED' },
      targetOrganisationId: { $in: [null, undefined] },
      targetNgoId: { $in: [null, undefined] },
      $and: [
        {
          $or: [
            { autoDeleteAt: { $exists: false } },
            { autoDeleteAt: null },
            { autoDeleteAt: { $gt: now } }
          ]
        },
        {
          $or: [
            { expiryTime: { $exists: false } },
            { expiryTime: null },
            { expiryTime: { $gt: now } }
          ]
        },
        {
          $or: [
            { overallExpiry: { $exists: false } },
            { overallExpiry: null },
            { overallExpiry: { $gt: now } }
          ]
        }
      ]
    };

    const foods = await Food.find(query)
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails')
      .sort({ createdAt: -1 });

    if (req.user.accountType === 'ORGANISATION' || req.user.accountType === 'ORGANIZATION') {
      const claims = await Claim.find({ ngoId: req.user.id, status: { $in: ['PENDING', 'ACCEPTED'] } });
      const claimedFoodIds = claims.map(c => c.foodId.toString());
      return res.json(foods.filter(f => !claimedFoodIds.includes(f._id.toString())));
    }

    res.json(foods);
  } catch (err) {
    console.error('Error fetching foods:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food/active-pickups
// @desc    Get active claimed pickups for the user (auto-archives COMPLETED/delivered)
// @access  Private
router.get('/active-pickups', auth, async (req, res) => {
  try {
    const activeStatuses = ['CLAIMED', 'ACCEPTED', 'IN_TRANSIT'];
    let query = { 
      status: { $in: activeStatuses },
      volunteerStatus: { $ne: 'delivered' }
    };
    if (req.user.accountType === 'DONOR') {
      query.donorId = req.user.id;
    } else {
      const Claim = require('../models/Claim');
      const acceptedClaims = await Claim.find({
        ngoId: req.user.id,
        status: { $in: ['ACCEPTED', 'IN_TRANSIT'] }
      }).select('foodId');
      const foodIds = acceptedClaims.map(c => c.foodId).filter(Boolean);
      query.$or = [
        { claimantId: req.user.id },
        { _id: { $in: foodIds } }
      ];
    }
    const foods = await Food.find(query)
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails location')
      .populate('claimantId', 'orgName fullName phone email address city location')
      .sort({ updatedAt: -1 });

    const Claim = require('../models/Claim');
    const enrichedFoods = await Promise.all(foods.map(async (f) => {
      const fObj = f.toObject();
      if (!fObj.claimantId || !fObj.claimantId.location) {
        const claim = await Claim.findOne({
          foodId: f._id,
          status: { $in: ['ACCEPTED', 'IN_TRANSIT'] }
        }).populate('ngoId', 'orgName fullName phone email address city location');
        if (claim && claim.ngoId) {
          fObj.claimantId = claim.ngoId;
          fObj.matchedNgoName = claim.ngoId.orgName || claim.ngoId.fullName;
        }
      }
      return fObj;
    }));
    res.json(enrichedFoods);
  } catch (err) {
    console.error('Error in /api/food/active-pickups:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/food/:id/certificate
// @desc    Get official donation certificate data for completed task
// @access  Public / Private
router.get('/:id/certificate', async (req, res) => {
  try {
    if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
      return res.status(404).json({ message: 'Invalid donation ID' });
    }
    const food = await Food.findById(req.params.id)
      .populate('donorId', 'orgName fullName address city email')
      .populate('claimantId', 'orgName fullName address city');
    if (!food) return res.status(404).json({ message: 'Donation not found' });

    const Claim = require('../models/Claim');
    const claim = await Claim.findOne({ foodId: food._id, status: { $in: ['ACCEPTED', 'COMPLETED', 'Accepted', 'Completed', 'Awaiting NGO', 'Pending', 'Requests Sent'] } })
      .populate('ngoId', 'orgName fullName address city');

    const donorName = food.donorId?.orgName || food.donorId?.fullName || 'Food Donor';
    const ngoName = claim?.ngoId?.orgName || claim?.ngoId?.fullName || food.claimantId?.orgName || food.claimantId?.fullName || 'Verified NGO Hub';
    const deliveryDate = food.confirmationTokens?.deliveryUsedAt || food.updatedAt || new Date();

    const certData = {
      certificateNumber: `FB-${food._id.toString().slice(-6).toUpperCase()}-${new Date(deliveryDate).getFullYear()}`,
      foodId: food._id,
      donorName,
      ngoName,
      itemTitle: food.title,
      quantity: `${food.quantity || 1} ${food.items?.[0]?.unit || 'servings'}`,
      foodType: food.foodType || 'Prepared Meals',
      donorLocation: food.address || food.pickupLocation || food.donorId?.city || 'Pune',
      deliveredDate: new Date(deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      verificationCode: food.verificationCode || 'VERIFIED-HANDOVER',
      thankYouMessage: 'In recognition of your compassionate contribution to reduce food waste and support families in need.'
    };

    res.json(certData);
  } catch (err) {
    console.error('Error fetching certificate:', err);
    res.status(500).json({ message: 'Server error generating certificate' });
  }
});

// @route   GET /api/food/:id
// @desc    Get single food listing by ID (Strict Authorization Enforced)
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Guard: skip if id is not a valid ObjectId
    if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
      return next();
    }
    const food = await Food.findById(req.params.id)
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails location')
      .populate('claimantId', 'orgName fullName phone email address city location')
      .populate('targetOrganisationId', 'orgName fullName phone email address city location')
      .populate('targetNgoId', 'orgName fullName phone email address city location')
      .populate('requirementId')
      .populate('fulfilledNeedId');

    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // STRICT SECURITY RULE: If targeted, only the target org, donor, or admin may access it
    const isTargeted = food.visibility === 'TARGETED' || food.targetOrganisationId || food.targetNgoId;
    if (isTargeted) {
      const currentUserId = req.user.id.toString();
      const donorUserId = (food.donorId?._id || food.donorId)?.toString();
      const targetOrgUserId = (food.targetOrganisationId?._id || food.targetOrganisationId || food.targetNgoId?._id || food.targetNgoId)?.toString();
      const claimantUserId = (food.claimantId?._id || food.claimantId)?.toString();
      const isAdmin = req.user.accountType === 'ADMIN' || req.user.role === 'ADMIN';

      const isAuthorized =
        isAdmin ||
        currentUserId === donorUserId ||
        currentUserId === targetOrgUserId ||
        currentUserId === claimantUserId;

      if (!isAuthorized) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this targeted donation.' });
      }
    }

    const foodObj = food.toObject();
    const claims = await Claim.find({ foodId: food._id })
      .populate('ngoId', 'orgName fullName phone email address city location')
      .sort({ createdAt: -1 });
    foodObj.claims = claims;
    foodObj.acceptedClaim = claims.find(c => c.status === 'ACCEPTED');
    foodObj.confirmationLinks = buildConfirmationUrls(food);
    res.json(foodObj);
  } catch (err) {
    console.error('Error fetching food by id:', err.message);
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

    // Security guard: Prevent other NGOs from claiming a targeted donation
    if (food.visibility === 'TARGETED' && (food.targetOrganisationId || food.targetNgoId)) {
      const targetOrg = (food.targetOrganisationId || food.targetNgoId).toString();
      if (targetOrg !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You cannot claim a donation targeted to another organisation.' });
      }
    }

    // Check if user already has a pending claim for this food
    const existingClaim = await Claim.findOne({ ngoId: req.user.id, foodId: food._id, status: 'PENDING' });
    if (existingClaim) {
      return res.status(400).json({ message: 'You already have a pending claim for this food' });
    }

    const { message, requestedPickupTime } = req.body;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({ message: 'Request message must be at least 10 characters long explaining your intent.' });
    }

    const newClaim = new Claim({
      ngoId: req.user.id,
      foodId: food._id,
      message: message.trim(),
      requestedPickupTime
    });
    await newClaim.save();

    // Log Activity for NGO
    const activity = new Activity({
      userId: req.user.id,
      action: `Requested to claim donation: "${food.title}"`
    });
    await activity.save();

    // Fetch NGO details for real-time notification
    const ngoUser = await User.findById(req.user.id).select('orgName fullName phone email address city');
    const ngoName = ngoUser?.orgName || ngoUser?.fullName || 'Organisation';
    
    // Format pickup time string safely whether it's full ISO/datetime, text, or legacy time
    let pickupTimeStr = 'Flexible';
    if (requestedPickupTime) {
      const parsedDate = new Date(requestedPickupTime);
      if (!isNaN(parsedDate.getTime()) && !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(requestedPickupTime.trim())) {
        pickupTimeStr = parsedDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (/^\d{1,2}:\d{2}/.test(requestedPickupTime.trim())) {
        pickupTimeStr = requestedPickupTime.trim();
      } else {
        pickupTimeStr = requestedPickupTime;
      }
    }

    const notification = new Notification({
      userId: food.donorId,
      type: 'CLAIM_REQUEST',
      title: `New Claim Request from ${ngoName}`,
      relatedClaimId: newClaim._id,
      relatedFoodId: food._id,
      message: message.trim(),
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

      // Broadcast listing update to all NGOs browsing the feed (only if untargeted)
      if (food.visibility !== 'TARGETED') {
        req.app.get('io').emit('LISTING_UPDATED', food);
      }
    }

    res.json(newClaim);
  } catch (err) {
    console.error('Error claiming food:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/accept-targeted
// @desc    Accept a targeted donation (Target Organisation only)
// @access  Private
router.patch('/:id/accept-targeted', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION' && req.user.accountType !== 'ORGANIZATION') {
      return res.status(403).json({ message: 'Only organisations can accept targeted donations' });
    }

    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const targetOrgId = (food.targetOrganisationId || food.targetNgoId)?.toString();
    if (food.visibility !== 'TARGETED' || targetOrgId !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You are not the target organisation for this donation.' });
    }

    if (food.status !== 'PENDING' && food.status !== 'AVAILABLE' && food.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Donation cannot be accepted in its current state (${food.status})` });
    }

    food.status = 'ACCEPTED';
    food.claimantId = req.user.id;

    // Generate pickup and delivery confirmation tokens
    generateTokensForFood(food);
    await food.save();

    // If tied to a requirement, update requirement to IN_PROGRESS
    if (food.requirementId || food.fulfilledNeedId) {
      const Need = require('../models/Need');
      await Need.updateOne(
        { _id: food.requirementId || food.fulfilledNeedId },
        { status: 'IN_PROGRESS', donorId: food.donorId, fulfilledFoodId: food._id }
      );
    }

    const ngoUser = await User.findById(req.user.id).select('orgName fullName phone email address city');
    const ngoName = ngoUser?.orgName || ngoUser?.fullName || 'Target Organisation';

    const notification = new Notification({
      userId: food.donorId,
      type: 'CLAIM_ACCEPTED',
      title: 'Donation Accepted!',
      relatedFoodId: food._id,
      message: `${ngoName} accepted your targeted food donation "${food.title}". Next step: Volunteer pickup assignment or direct handover.`,
      stage: 'Accepted by Organisation'
    });
    await notification.save();

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(food.donorId, 'NEW_NOTIFICATION', {
        ...notification.toObject(),
        userId: food.donorId.toString(),
        foodTitle: food.title
      });
      emitToUser(food.donorId, 'TARGETED_DONATION_ACCEPTED', food);
      emitToUser(req.user.id, 'TARGETED_DONATION_ACCEPTED', food);
      emitToUser(food.donorId, 'LISTING_UPDATED', food);
      emitToUser(req.user.id, 'LISTING_UPDATED', food);
    }

    res.json(food);
  } catch (err) {
    console.error('Error accepting targeted donation:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/reject
// @desc    Reject a food listing (NGO only)
// @access  Private
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION' && req.user.accountType !== 'ORGANIZATION') {
      return res.status(403).json({ message: 'Only organisations can reject food' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const isTargeted = food.visibility === 'TARGETED' || food.targetOrganisationId || food.targetNgoId;
    if (isTargeted) {
      const targetOrgId = (food.targetOrganisationId || food.targetNgoId)?.toString();
      if (targetOrgId !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You cannot reject a donation targeted to another organisation.' });
      }
    }

    if (!['AVAILABLE', 'ACTIVE', 'PENDING'].includes(food.status)) {
      return res.status(400).json({ message: `Food not available for rejection (current status: ${food.status})` });
    }

    const { reason, notes } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const fullReason = notes ? `${reason} - ${notes}` : reason;

    food.status = 'REJECTED';
    food.rejectedBy = req.user.id;
    food.rejectionReason = fullReason;
    await food.save();

    // If linked to a requirement, reopen the requirement so others can fulfill it
    if (food.requirementId || food.fulfilledNeedId) {
      const Need = require('../models/Need');
      const need = await Need.findOneAndUpdate(
        { _id: food.requirementId || food.fulfilledNeedId },
        { status: 'ACTIVE', donorId: null, fulfilledFoodId: null, claimedAt: null },
        { new: true }
      );
      if (need && req.app.get('io')) {
        req.app.get('io').emit('NEED_UPDATED', need);
      }
    }

    // Log Activity for NGO
    const activity = new Activity({
      userId: req.user.id,
      action: `Rejected donation: "${food.title}" (Reason: ${fullReason})`
    });
    await activity.save();

    // Notify Donor
    const ngoUser = await User.findById(req.user.id).select('orgName fullName');
    const ngoName = ngoUser?.orgName || ngoUser?.fullName || 'An NGO';
    
    const notification = new Notification({
      userId: food.donorId,
      type: 'INFO',
      title: 'Donation Rejected',
      relatedFoodId: food._id,
      message: `${ngoName} rejected your donation "${food.title}". Reason: ${fullReason}`,
      stage: 'Rejected'
    });
    await notification.save();

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(food.donorId, 'NEW_NOTIFICATION', {
        ...notification.toObject(),
        userId: food.donorId.toString(),
        foodTitle: food.title
      });
      emitToUser(food.donorId, 'LISTING_UPDATED', food);
      emitToUser(req.user.id, 'LISTING_UPDATED', food);
    }

    // Only broadcast to everyone if it was public
    if (!isTargeted && req.app.get('io')) {
      req.app.get('io').emit('LISTING_UPDATED', food);
    }

    res.json(food);
  } catch (err) {
    console.error('Error rejecting food:', err);
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

// @route   PATCH /api/food/:id/owner-delete
// @desc    Soft-delete a FINISHED food listing for the owner's dashboard view only.
//          Only works on terminal states: COMPLETED, NON_CLAIMED, CANCELLED, REJECTED, DECLINED.
//          The record is kept in DB for history/analytics/certificates.
// @access  Private (DONOR only)
router.patch('/:id/owner-delete', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can hide their listings' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const TERMINAL = ['COMPLETED', 'NON_CLAIMED', 'CANCELLED', 'REJECTED', 'DECLINED', 'Pending', 'Requests Sent', 'Accepted', 'Awaiting NGO'];
    if (!TERMINAL.includes(food.status)) {
      return res.status(400).json({ message: 'Only completed, expired, or cancelled postings can be deleted from the dashboard.' });
    }
    food.deletedByOwner = true;
    food.deletedAt = new Date();
    await food.save();
    res.json({ success: true, message: 'Posting removed from your dashboard.' });
  } catch (err) {
    console.error('Error soft-deleting food:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/food/:id
// @desc    Hard-delete an UNCLAIMED food listing (Donor only)
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
    // Only allow hard-delete on unclaimed listings
    if (!['AVAILABLE', 'ACTIVE'].includes(food.status)) {
      return res.status(400).json({ message: 'Cannot delete a claimed or processed listing. Use the soft-delete option instead.' });
    }

    await food.deleteOne();
    // Cleanup any pending claims
    await Claim.deleteMany({ foodId: food._id });

    const io = req.app.get('io');
    if (io) io.emit('LISTING_DELETED', { _id: food._id.toString() });

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

// @route   PATCH /api/food/:id/cancel
// @desc    Cancel a food listing (Donor only)
// @access  Private
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can cancel food listings' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    food.status = 'CANCELLED';
    await food.save();
    
    // Also cancel any pending/accepted claims
    const Claim = require('../models/Claim');
    await Claim.updateMany(
      { foodId: food._id, status: { $in: ['PENDING', 'ACCEPTED'] } },
      { $set: { status: 'DECLINED', declineReason: 'Donor cancelled the listing' } }
    );

    res.json({ message: 'Food listing cancelled successfully', food });
  } catch (err) {
    console.error('Error cancelling food:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/collected
// @desc    Mark a food listing as collected (Donor only)
// @access  Private
router.patch('/:id/collected', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can update food status' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    food.status = 'COMPLETED';
    await food.save();

    res.json({ message: 'Food marked as collected', food });
  } catch (err) {
    console.error('Error marking collected:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/status
// @desc    Advance tracking status (ACCEPTED → IN_TRANSIT → COMPLETED)
//          Called by the Donation Tracking Page to persist pickup progress.
// @access  Private (donor or accepted-claim NGO)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const userId = req.user.id?.toString();
    const userAccountType = (req.user.accountType || '').toUpperCase();
    const isDonor = (food.donorId?._id || food.donorId)?.toString() === userId;
    const isOrg = userAccountType === 'ORGANISATION' || userAccountType === 'ORGANIZATION';
    const isDirectClaimant = (food.claimantId?._id || food.claimantId)?.toString() === userId;
    const acceptedClaim = await Claim.findOne({ foodId: food._id, ngoId: userId, status: 'ACCEPTED' });
    const isClaimantNgo = (acceptedClaim || isDirectClaimant) && isOrg;

    if (!isDonor && !isClaimantNgo) {
      return res.status(403).json({ message: 'Not authorized to update this donation status.' });
    }

    const { status } = req.body;
    const ALLOWED = ['ACCEPTED', 'IN_TRANSIT', 'COMPLETED'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED.join(', ')}` });
    }

    // Only allow advancing forward (prevent rollback)
    const ORDER = { ACCEPTED: 0, IN_TRANSIT: 1, COMPLETED: 2 };
    const currentOrder = ORDER[food.status] ?? -1;
    const newOrder = ORDER[status] ?? -1;
    if (newOrder < currentOrder) {
      return res.status(400).json({ message: `Cannot roll back status from ${food.status} to ${status}` });
    }

    food.status = status;
    await food.save();

    // Notify both parties via socket
    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');
    if (io) io.emit('LISTING_UPDATED', food);
    if (emitToUser) {
      if (food.donorId) emitToUser(food.donorId.toString(), 'LISTING_UPDATED', food);
      if (food.claimantId) emitToUser(food.claimantId.toString(), 'LISTING_UPDATED', food);
    }

    res.json({ message: `Status updated to ${status}`, food });
  } catch (err) {
    console.error('Error updating food status:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/assign-volunteer
// @desc    Assign volunteer(s) for pickup (NGO or Donor)
// @access  Private
router.patch('/:id/assign-volunteer', auth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    
    // Check authorization: must be either the donor of the food or the NGO claimant
    const userId = req.user.id?.toString();
    const userAccountType = (req.user.accountType || '').toUpperCase();
    const isDonor = (food.donorId?._id || food.donorId)?.toString() === userId;
    
    // Check if user is the claimant NGO
    const isOrg = userAccountType === 'ORGANISATION' || userAccountType === 'ORGANIZATION';
    const isDirectClaimant = (food.claimantId?._id || food.claimantId)?.toString() === userId;
    const acceptedClaim = await Claim.findOne({ foodId: food._id, ngoId: userId, status: 'ACCEPTED' });
    const isClaimantNgo = (acceptedClaim || isDirectClaimant) && isOrg;
    
    if (!isDonor && !isClaimantNgo) {
       return res.status(403).json({ message: 'Not authorized for this donation. Only the posting donor or claiming NGO may assign volunteers.' });
    }

    const { volunteers, name, phone, vehicleNumber, arrivalTime } = req.body;
    let list = [];

    if (Array.isArray(volunteers) && volunteers.length > 0) {
      list = volunteers.map(v => ({
        name: v.name || '',
        phone: v.phone || '',
        vehicleNumber: v.vehicleNumber || v.arrivalTime || ''
      }));
    } else if (name) {
      list = [{
        name,
        phone: phone || '',
        vehicleNumber: vehicleNumber || arrivalTime || ''
      }];
    }

    food.volunteerAssignments = list;
    if (list.length > 0) {
      food.volunteerAssignment = {
        name: list[0].name,
        phone: list[0].phone,
        arrivalTime: list[0].vehicleNumber
      };
      food.volunteerStatus = 'assigned';
      food.volunteerDeclineReason = null;
    }

    // Generate signed single-use confirmation tokens for Donor, NGO, and Volunteer
    const tokens = generateTokensForFood(food._id);
    food.confirmationTokens = {
      pickupToken: tokens.pickupToken,
      pickupUsedAt: null,
      deliveryToken: tokens.deliveryToken,
      deliveryUsedAt: null,
      volunteerToken: tokens.volunteerToken
    };

    // Generate one 4-digit handover code per donation when a volunteer is assigned
    const handoverCode = Math.floor(1000 + Math.random() * 9000).toString();
    food.verificationCode = handoverCode;
    food.verificationAttempts = 0;

    await food.save();

    const confirmationLinks = buildConfirmationUrls(food);

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      if (food.donorId) emitToUser(food.donorId.toString(), 'LISTING_UPDATED', food);
      if (food.claimantId) emitToUser(food.claimantId.toString(), 'LISTING_UPDATED', food);
    }

    const io = req.app.get('io');
    if (io) io.emit('LISTING_UPDATED', food);

    res.json({
      message: 'Volunteer(s) assigned successfully',
      food,
      confirmationLinks
    });
  } catch (err) {
    console.error('Error assigning volunteer:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PATCH /api/food/:id/receipt-condition
// @desc    Update receipt condition after completion (NGO only)
// @access  Private
router.patch('/:id/receipt-condition', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can mark receipt condition' });
    }
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    
    if (food.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Donation must be collected/completed first' });
    }

    const { condition, note } = req.body;
    if (!['Good', 'Acceptable', 'Issue Reported'].includes(condition)) {
      return res.status(400).json({ message: 'Invalid condition' });
    }

    food.receiptCondition = condition;
    food.receiptNote = note || '';
    await food.save();

    const io = req.app.get('io');
    if (io) io.emit('LISTING_UPDATED', food);

    res.json({ message: 'Receipt condition updated', food });
  } catch (err) {
    console.error('Error updating receipt condition:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
