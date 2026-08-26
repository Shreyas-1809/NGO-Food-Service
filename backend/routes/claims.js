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
// @desc    Accept a claim request
// @access  Private (Donor only)
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

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    food.status = 'CLAIMED';
    food.claimantId = claim.ngoId;
    food.verificationCode = code;
    await food.save();

    // Mark related notification as read
    const notification = await Notification.findOne({ relatedClaimId: claim._id, userId: req.user.id });
    if (notification) {
      notification.read = true;
      await notification.save();
    }

    // Notify NGO with structured claim response type
    const donorUser = await require('../models/User').findById(req.user.id).select('fullName orgName phone address city');
    const donorName = donorUser?.orgName || donorUser?.fullName || 'Donor';

    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'CLAIM_ACCEPTED',
      title: 'Claim Request Accepted! 🤝',
      message: `${donorName} accepted your claim for "${food.title}". Verification Code: ${code}`,
      relatedClaimId: claim._id
    });
    await ngoNotification.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('LISTING_UPDATED', food);
    }

    res.json({ claim, food, verificationCode: code });
  } catch (err) {
    console.error('Error accepting claim:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/claims/:id/decline
// @desc    Decline a claim request
// @access  Private (Donor only)
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

    // Mark related notification as read
    const notification = await Notification.findOne({ relatedClaimId: claim._id, userId: req.user.id });
    if (notification) {
      notification.read = true;
      await notification.save();
    }

    const donorUser = await require('../models/User').findById(req.user.id).select('fullName orgName');
    const donorName = donorUser?.orgName || donorUser?.fullName || 'Donor';

    // Notify NGO
    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'CLAIM_DECLINED',
      title: 'Claim Request Declined',
      message: `${donorName} declined your claim for "${food.title}".${req.body.reason ? ` Reason: ${req.body.reason}` : ''}`,
      relatedClaimId: claim._id
    });
    await ngoNotification.save();

    // Food status stays AVAILABLE

    res.json({ claim, food });
  } catch (err) {
    console.error('Error declining claim:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
