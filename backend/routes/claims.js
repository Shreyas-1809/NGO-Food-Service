const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Claim = require('../models/Claim');
const Food = require('../models/Food');
const Notification = require('../models/Notification');

// @route   GET /api/claims/donor/my-requests
// @desc    Get all claim requests on current donor's food listings
// @access  Private (Donor only)
router.get('/donor/my-requests', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'DONOR') {
      return res.status(403).json({ message: 'Only donors can access their listing claim requests' });
    }
    // Find all food IDs posted by this donor
    const donorFoods = await Food.find({ donorId: req.user.id }).select('_id');
    const foodIds = donorFoods.map(f => f._id);

    const claims = await Claim.find({ foodId: { $in: foodIds } })
      .populate('ngoId', 'orgName fullName phone email address city')
      .populate('foodId')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    console.error('Error fetching donor claim requests:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/claims/:id
// @desc    Get claim by ID (populated with NGO and Food)
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'orgName fullName phone email address city location')
      .populate('foodId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (err) {
    console.error('Error fetching claim:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/claims/:id/accept
// @desc    Accept a claim request (Donor only)
// @access  Private
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    const food = await Food.findById(claim.foodId);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (claim.status !== 'PENDING') {
      return res.status(400).json({ message: 'Claim is already processed' });
    }

    claim.status = 'ACCEPTED';
    await claim.save();

    // Auto-decline any other pending claims for this same food item
    await Claim.updateMany(
      { foodId: food._id, _id: { $ne: claim._id }, status: 'PENDING' },
      { status: 'DECLINED', declineReason: 'Another organisation request was accepted by the donor.' }
    );

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    food.status = 'ACCEPTED';
    food.claimantId = claim.ngoId;
    food.verificationCode = code;
    await food.save();

    // Update the original CLAIM_REQUEST notification for the donor:
    // change its stage to reflect accepted state and mark as read.
    await Notification.findOneAndUpdate(
      { relatedClaimId: claim._id, userId: req.user.id, type: 'CLAIM_REQUEST' },
      {
        read: true,
        stage: 'Accepted — awaiting NGO confirmation'
      }
    );

    // Notify NGO with full lifecycle context
    const User = require('../models/User');
    const donorUser = await User.findById(req.user.id).select('fullName orgName phone address city');
    const donorName = donorUser?.orgName || donorUser?.fullName || 'Donor';

    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'CLAIM_ACCEPTED',
      title: 'Claim Request Accepted! 🤝',
      message: `${donorName} accepted your claim for "${food.title}". Verification Code: ${code}`,
      relatedClaimId: claim._id,
      relatedFoodId: food._id,
      stage: 'Accepted — awaiting your confirmation'
    });
    await ngoNotification.save();

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      // Targeted emit to NGO's room only
      emitToUser(claim.ngoId, 'CLAIM_ACCEPTED', {
        claim,
        food,
        ngoId: claim.ngoId.toString(),
        verificationCode: code,
        donorName
      });
      emitToUser(claim.ngoId, 'NEW_NOTIFICATION', {
        ...ngoNotification.toObject(),
        userId: claim.ngoId.toString()
      });

      // Also notify the donor's own room that the listing updated
      emitToUser(req.user.id, 'LISTING_UPDATED', food);
    }

    res.json({ claim, food, verificationCode: code });
  } catch (err) {
    console.error('Error accepting claim:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/claims/:id/decline
// @desc    Decline a claim request (Donor only)
// @access  Private
router.patch('/:id/decline', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    const food = await Food.findById(claim.foodId);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    if (food.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (claim.status !== 'PENDING') {
      return res.status(400).json({ message: 'Claim is already processed' });
    }

    claim.status = 'DECLINED';
    claim.declineReason = req.body.reason || '';
    await claim.save();

    // Check if other pending claims exist for this food item
    const pendingRemaining = await Claim.countDocuments({ foodId: food._id, status: 'PENDING' });
    const acceptedRemaining = await Claim.countDocuments({ foodId: food._id, status: 'ACCEPTED' });

    if (pendingRemaining === 0 && acceptedRemaining === 0) {
      food.status = 'REJECTED';
      await food.save();
    }

    // Mark the donor's CLAIM_REQUEST notification as read
    await Notification.findOneAndUpdate(
      { relatedClaimId: claim._id, userId: req.user.id, type: 'CLAIM_REQUEST' },
      { read: true, stage: 'Declined' }
    );

    const User = require('../models/User');
    const donorUser = await User.findById(req.user.id).select('fullName orgName');
    const donorName = donorUser?.orgName || donorUser?.fullName || 'Donor';

    // Notify NGO of the decline
    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'CLAIM_DECLINED',
      title: 'Claim Request Declined',
      message: `${donorName} declined your claim for "${food.title}".${req.body.reason ? ` Reason: ${req.body.reason}` : ''}`,
      relatedClaimId: claim._id,
      relatedFoodId: food._id,
      stage: 'Request declined'
    });
    await ngoNotification.save();

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(claim.ngoId, 'CLAIM_DECLINED', {
        claim,
        food,
        ngoId: claim.ngoId.toString(),
        donorName,
        reason: req.body.reason || ''
      });
      emitToUser(claim.ngoId, 'NEW_NOTIFICATION', {
        ...ngoNotification.toObject(),
        userId: claim.ngoId.toString()
      });
      emitToUser(req.user.id, 'LISTING_UPDATED', food);
    }

    res.json({ claim, food });
  } catch (err) {
    console.error('Error declining claim:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/claims/:id/ngo-confirm
// @desc    NGO confirms their side after being accepted — advances the workflow stage.
//          Notifies the donor that the NGO is confirmed and pickup is imminent.
// @access  Private (ORGANISATION only)
router.patch('/:id/ngo-confirm', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can confirm a claim' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('foodId')
      .populate('ngoId', 'orgName fullName');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (claim.ngoId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized — this is not your claim' });
    }
    if (claim.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Claim must be in ACCEPTED state to confirm' });
    }

    const food = claim.foodId;
    const ngoName = claim.ngoId?.orgName || claim.ngoId?.fullName || 'Organisation';

    // Update NGO's own CLAIM_ACCEPTED notification stage
    await Notification.findOneAndUpdate(
      { relatedClaimId: claim._id, userId: req.user.id, type: 'CLAIM_ACCEPTED' },
      { stage: 'Confirmed — volunteer being arranged', read: true }
    );

    // Notify the donor that the NGO confirmed
    const donorNotification = new Notification({
      userId: food.donorId,
      type: 'NGO_CONFIRMED',
      title: 'NGO Confirmed Pickup! ✅',
      message: `${ngoName} confirmed collection for "${food.title}". Prepare for pickup.`,
      relatedClaimId: claim._id,
      relatedFoodId: food._id,
      stage: 'NGO confirmed — volunteer being arranged'
    });
    await donorNotification.save();

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(food.donorId, 'NGO_CONFIRMED', { claim, food, ngoName });
      emitToUser(food.donorId, 'NEW_NOTIFICATION', {
        ...donorNotification.toObject(),
        userId: food.donorId.toString()
      });
    }

    res.json({ success: true, message: 'Confirmation sent to donor' });
  } catch (err) {
    console.error('Error confirming NGO side:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
