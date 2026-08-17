const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Claim = require('../models/Claim');
const Food = require('../models/Food');
const Notification = require('../models/Notification');

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

    // Notify NGO
    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'INFO',
      message: `Your claim for "${food.title}" was accepted! Code: ${code}`,
    });
    await ngoNotification.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('LISTING_UPDATED', food);
      // You could emit a notification update here if needed
    }

    res.json({ claim, food });
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

    // Notify NGO
    const ngoNotification = new Notification({
      userId: claim.ngoId,
      type: 'INFO',
      message: `Your claim for "${food.title}" was declined.`,
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
