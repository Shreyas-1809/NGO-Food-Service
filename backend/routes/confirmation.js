const express = require('express');
const router = express.Router();
const Food = require('../models/Food');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const { verifyConfirmationToken, buildConfirmationUrls } = require('../utils/confirmationTokens');

// Helper to find food by ID or by Claim ID (supports taskId as food._id or claim._id)
async function findFoodByTaskId(taskId) {
  let food = await Food.findById(taskId)
    .populate('donorId', 'orgName fullName phone email address city')
    .populate('claimantId', 'orgName fullName phone email address city');

  if (!food) {
    const claim = await Claim.findById(taskId);
    if (claim && claim.foodId) {
      food = await Food.findById(claim.foodId)
        .populate('donorId', 'orgName fullName phone email address city')
        .populate('claimantId', 'orgName fullName phone email address city');
    }
  }
  return food;
}

// @route   GET /api/confirm/task/:taskId
// @desc    Public, token-authenticated route for the Volunteer Task Page
// @access  Public (Token validated)
router.get('/task/:taskId', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Missing task token in link.' });
    }

    const verification = verifyConfirmationToken(token, 'VOLUNTEER');
    if (!verification.valid) {
      return res.status(401).json({ valid: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ valid: false, message: 'Task or donation not found.' });
    }

    // Verify token matches the food's recorded volunteer token
    if (food.confirmationTokens?.volunteerToken !== token) {
      return res.status(403).json({ valid: false, message: 'This volunteer task link has been superseded or is invalid.' });
    }

    // Fetch accepted claim for NGO details
    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: { $in: ['ACCEPTED', 'COMPLETED'] } })
      .populate('ngoId', 'orgName fullName phone email address city')
      .sort({ updatedAt: -1 });

    const donorObj = food.donorId || {};
    const ngoObj = acceptedClaim?.ngoId || food.claimantId || {};

    const donorAddress = food.pickupAddress || [donorObj.address, donorObj.city].filter(Boolean).join(', ') || 'Pune Pickup Point';
    const ngoAddress = [ngoObj.address, ngoObj.city].filter(Boolean).join(', ') || 'Pune NGO Hub';

    const donorMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donorAddress)}`;
    const ngoMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngoAddress)}`;

    const links = buildConfirmationUrls(food);

    res.json({
      valid: true,
      taskId: food._id,
      itemTitle: food.title,
      title: food.title,
      status: food.status,
      volunteerStatus: food.volunteerStatus || 'pending',
      volunteerDeclineReason: food.volunteerDeclineReason || null,
      task: {
        id: food._id,
        title: food.title,
        quantity: food.quantity,
        unit: food.items?.[0]?.unit || 'Portions',
        foodType: food.foodType,
        items: food.items || [],
        status: food.status,
        volunteerStatus: food.volunteerStatus || 'pending',
        volunteerDeclineReason: food.volunteerDeclineReason || null,
        pickupConfirmed: Boolean(food.confirmationTokens?.pickupUsedAt || ['IN_TRANSIT', 'COMPLETED'].includes(food.status)),
        deliveryConfirmed: Boolean(food.confirmationTokens?.deliveryUsedAt || food.status === 'COMPLETED'),
        requestedPickupTime: acceptedClaim?.requestedPickupTime || food.pickupTimeSlot?.start || null,
        notes: food.notes || ''
      },
      volunteer: food.volunteerAssignment || (food.volunteerAssignments?.[0] || { name: 'Assigned Volunteer', phone: '' }),
      donor: {
        name: donorObj.orgName || donorObj.fullName || 'Food Donor',
        phone: donorObj.phone || '',
        email: donorObj.email || '',
        address: donorAddress,
        mapsUrl: donorMapsUrl
      },
      ngo: {
        name: ngoObj.orgName || ngoObj.fullName || 'Recipient NGO',
        phone: ngoObj.phone || '',
        email: ngoObj.email || '',
        address: ngoAddress,
        mapsUrl: ngoMapsUrl
      },
      links
    });
  } catch (err) {
    console.error('Error fetching volunteer task:', err);
    res.status(500).json({ valid: false, message: 'Server error loading task.' });
  }
});

// @route   GET /api/confirm/pickup/:taskId
// @desc    Validate donor pickup confirmation link and return task summary
// @access  Public (Token validated)
router.get('/pickup/:taskId', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Missing confirmation token in link.' });
    }

    const verification = verifyConfirmationToken(token, 'PICKUP');
    if (!verification.valid) {
      return res.status(401).json({ valid: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ valid: false, message: 'Donation listing not found.' });
    }

    // Token must match active token recorded on food
    if (food.confirmationTokens?.pickupToken !== token) {
      return res.status(400).json({ valid: false, message: 'This pickup link is no longer valid or has been refreshed.' });
    }

    // Single-use & stage check: if already used or status past pickup
    if (food.confirmationTokens?.pickupUsedAt || ['IN_TRANSIT', 'COMPLETED'].includes(food.status)) {
      return res.status(400).json({
        valid: false,
        alreadyConfirmed: true,
        message: 'This pickup confirmation link is no longer valid or food has already been picked up.',
        status: food.status
      });
    }

    const donorObj = food.donorId || {};
    const volunteer = food.volunteerAssignment || (food.volunteerAssignments?.[0] || { name: 'the assigned volunteer' });

    res.json({
      valid: true,
      taskId: food._id,
      item: food.title,
      itemTitle: food.title,
      title: food.title,
      quantity: food.quantity,
      unit: food.items?.[0]?.unit || 'Portions',
      donorName: donorObj.orgName || donorObj.fullName || 'Food Donor',
      volunteerName: volunteer.name || 'the assigned volunteer',
      status: food.status
    });
  } catch (err) {
    console.error('Error verifying pickup link:', err);
    res.status(500).json({ valid: false, message: 'Server error verifying confirmation link.' });
  }
});

// @route   POST /api/confirm/pickup/:taskId
// @desc    Donor confirms they handed food to the volunteer
// @access  Public (Single-use token required)
router.post('/pickup/:taskId', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing confirmation token.' });
    }

    const verification = verifyConfirmationToken(token, 'PICKUP');
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Donation listing not found.' });
    }

    if (food.confirmationTokens?.pickupToken !== token) {
      return res.status(400).json({ success: false, message: 'This pickup link is no longer valid or has been refreshed.' });
    }

    if (food.confirmationTokens?.pickupUsedAt || ['IN_TRANSIT', 'COMPLETED'].includes(food.status)) {
      return res.status(400).json({
        success: false,
        message: 'This link has already been used. The pickup was previously confirmed.'
      });
    }

    // Mark food as IN_TRANSIT and invalidate the single-use pickup token
    food.status = 'IN_TRANSIT';
    food.confirmationTokens.pickupUsedAt = new Date();
    await food.save();

    // Update active claim status / logs
    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: 'ACCEPTED' });

    // Emit live socket updates to all connected views
    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');

    if (io) {
      io.emit('LISTING_UPDATED', food);
      io.emit('TASK_UPDATED', { taskId: food._id, status: 'IN_TRANSIT', pickupConfirmed: true });
    }

    // Create notification for recipient NGO
    if (acceptedClaim && emitToUser) {
      try {
        const volName = food.volunteerAssignment?.name || 'Volunteer';
        const notif = new Notification({
          userId: acceptedClaim.ngoId,
          type: 'STATUS_UPDATE',
          title: 'Food Picked Up — On The Way 🚚',
          message: `Donor confirmed handover of "${food.title}" to ${volName}. Food is now in-transit to your hub.`,
          relatedClaimId: acceptedClaim._id,
          relatedFoodId: food._id,
          stage: 'In Transit'
        });
        await notif.save();
        emitToUser(acceptedClaim.ngoId.toString(), 'NEW_NOTIFICATION', notif);
      } catch (notifErr) {
        console.warn('Pickup confirmation notification failed:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: `Pickup confirmed! Food is now en-route with ${food.volunteerAssignment?.name || 'the volunteer'}.`,
      food,
      status: 'IN_TRANSIT'
    });
  } catch (err) {
    console.error('Error confirming pickup:', err);
    res.status(500).json({ success: false, message: 'Server error processing pickup confirmation.' });
  }
});

// @route   GET /api/confirm/delivery/:taskId
// @desc    Validate NGO delivery confirmation link and return task summary
// @access  Public (Token validated)
router.get('/delivery/:taskId', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Missing confirmation token in link.' });
    }

    const verification = verifyConfirmationToken(token, 'DELIVERY');
    if (!verification.valid) {
      return res.status(401).json({ valid: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ valid: false, message: 'Donation listing not found.' });
    }

    if (food.confirmationTokens?.deliveryToken !== token) {
      return res.status(400).json({ valid: false, message: 'This delivery link is no longer valid or has been refreshed.' });
    }

    // Single-use & stage check: if already completed
    if (food.confirmationTokens?.deliveryUsedAt || food.status === 'COMPLETED') {
      return res.status(400).json({
        valid: false,
        alreadyConfirmed: true,
        message: 'This delivery confirmation link is no longer valid or food has already been received.',
        status: food.status
      });
    }

    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: { $in: ['ACCEPTED', 'COMPLETED'] } })
      .populate('ngoId', 'orgName fullName');

    const ngoObj = acceptedClaim?.ngoId || food.claimantId || {};
    const volunteer = food.volunteerAssignment || (food.volunteerAssignments?.[0] || { name: 'the assigned volunteer' });

    res.json({
      valid: true,
      taskId: food._id,
      item: food.title,
      itemTitle: food.title,
      title: food.title,
      quantity: food.quantity,
      unit: food.items?.[0]?.unit || 'Portions',
      ngoName: ngoObj.orgName || ngoObj.fullName || 'Recipient NGO',
      volunteerName: volunteer.name || 'the assigned volunteer',
      status: food.status
    });
  } catch (err) {
    console.error('Error verifying delivery link:', err);
    res.status(500).json({ valid: false, message: 'Server error verifying confirmation link.' });
  }
});

// @route   POST /api/confirm/delivery/:taskId
// @desc    NGO confirms they received food from the volunteer
// @access  Public (Single-use token required)
router.post('/delivery/:taskId', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing confirmation token.' });
    }

    const verification = verifyConfirmationToken(token, 'DELIVERY');
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Donation listing not found.' });
    }

    if (food.confirmationTokens?.deliveryToken !== token) {
      return res.status(400).json({ success: false, message: 'This delivery link is no longer valid or has been refreshed.' });
    }

    if (food.confirmationTokens?.deliveryUsedAt || food.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'This delivery confirmation link has already been used. The delivery was previously confirmed.'
      });
    }

    // Mark food and claim as COMPLETED and invalidate the single-use delivery token
    food.status = 'COMPLETED';
    food.confirmationTokens.deliveryUsedAt = new Date();
    await food.save();

    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: 'ACCEPTED' });
    if (acceptedClaim) {
      acceptedClaim.status = 'COMPLETED';
      await acceptedClaim.save();
    }

    // Emit live socket updates
    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');

    if (io) {
      io.emit('LISTING_UPDATED', food);
      io.emit('TASK_UPDATED', { taskId: food._id, status: 'COMPLETED', deliveryConfirmed: true });
    }

    // Create notifications for both Donor and NGO
    const volName = food.volunteerAssignment?.name || 'Volunteer';
    if (food.donorId && emitToUser) {
      try {
        const donorNotif = new Notification({
          userId: food.donorId,
          type: 'STATUS_UPDATE',
          title: 'Donation Delivered & Completed ✓',
          message: `The recipient NGO has confirmed receiving "${food.title}" from ${volName}. Thank you for your generous impact!`,
          relatedClaimId: acceptedClaim?._id,
          relatedFoodId: food._id,
          stage: 'Delivered ✓'
        });
        await donorNotif.save();
        emitToUser(food.donorId.toString(), 'NEW_NOTIFICATION', donorNotif);
      } catch (notifErr) {
        console.warn('Delivery confirmation notification failed:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Delivery confirmed! The food has been safely received and logged.',
      food,
      status: 'COMPLETED'
    });
  } catch (err) {
    console.error('Error confirming delivery:', err);
    res.status(500).json({ success: false, message: 'Server error processing delivery confirmation.' });
  }
});

// @route   POST /api/confirm/volunteer-accept/:taskId
// @desc    Volunteer accepts the pickup task — moves status to ACCEPTED (volunteer confirmed)
// @access  Public (volunteerToken required)
router.post('/volunteer-accept/:taskId', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing volunteer token.' });
    }

    const verification = verifyConfirmationToken(token, 'VOLUNTEER');
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (food.confirmationTokens?.volunteerToken !== token) {
      return res.status(403).json({ success: false, message: 'This volunteer link is no longer valid.' });
    }

    if (food.volunteerStatus === 'accepted') {
      return res.json({ success: true, alreadyAccepted: true, message: 'You have already accepted this task.', status: food.status });
    }

    // Mark volunteer as accepted — food status stays as-is (CLAIMED/ACCEPTED),
    // pickup confirmed moves status to IN_TRANSIT via the donor link
    food.volunteerStatus = 'accepted';
    await food.save();

    // Notify NGO and Donor via socket
    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');

    if (io) {
      io.emit('TASK_UPDATED', {
        taskId: food._id,
        volunteerStatus: 'accepted',
        volunteerName: food.volunteerAssignment?.name || food.volunteerAssignments?.[0]?.name || 'Volunteer'
      });
      io.emit('LISTING_UPDATED', food);
    }

    // Notify the NGO claimant
    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: { $in: ['ACCEPTED', 'CLAIMED'] } });
    if (acceptedClaim?.ngoId && emitToUser) {
      try {
        const notif = new Notification({
          userId: acceptedClaim.ngoId,
          type: 'STATUS_UPDATE',
          title: `Volunteer Accepted Task ✅`,
          message: `${food.volunteerAssignment?.name || 'Your volunteer'} has accepted the pickup task for "${food.title}" and is on the way to collect.`,
          relatedClaimId: acceptedClaim._id,
          relatedFoodId: food._id,
          stage: 'Volunteer Accepted'
        });
        await notif.save();
        emitToUser(acceptedClaim.ngoId.toString(), 'NEW_NOTIFICATION', notif);
      } catch (notifErr) {
        console.warn('Volunteer accept notification failed:', notifErr.message);
      }
    }

    res.json({ success: true, message: 'You have accepted this pickup task. Head to the donor location!', volunteerStatus: 'accepted' });
  } catch (err) {
    console.error('Error processing volunteer accept:', err);
    res.status(500).json({ success: false, message: 'Server error processing your acceptance.' });
  }
});

// @route   POST /api/confirm/volunteer-decline/:taskId
// @desc    Volunteer declines the pickup task — sets volunteerStatus to 'declined', notifies NGO for reassignment
// @access  Public (volunteerToken required)
router.post('/volunteer-decline/:taskId', async (req, res) => {
  try {
    const { token, reason } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing volunteer token.' });
    }

    const verification = verifyConfirmationToken(token, 'VOLUNTEER');
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.error });
    }

    const food = await findFoodByTaskId(req.params.taskId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (food.confirmationTokens?.volunteerToken !== token) {
      return res.status(403).json({ success: false, message: 'This volunteer link is no longer valid.' });
    }

    if (food.volunteerStatus === 'declined') {
      return res.json({ success: true, alreadyDeclined: true, message: 'You have already declined this task. The NGO has been notified.' });
    }

    // Mark declined — invalidate the volunteer token so the link no longer works
    food.volunteerStatus = 'declined';
    food.volunteerDeclineReason = reason || 'No reason provided';
    food.confirmationTokens.volunteerToken = null; // Invalidate token
    await food.save();

    const io = req.app.get('io');
    const emitToUser = req.app.get('emitToUser');

    if (io) {
      io.emit('TASK_UPDATED', {
        taskId: food._id,
        volunteerStatus: 'declined',
        volunteerName: food.volunteerAssignment?.name || 'Volunteer',
        declineReason: food.volunteerDeclineReason
      });
      io.emit('LISTING_UPDATED', food);
    }

    // CRITICAL: Notify NGO immediately so they can reassign — never fail silently
    const acceptedClaim = await Claim.findOne({ foodId: food._id, status: { $in: ['ACCEPTED', 'CLAIMED'] } });
    if (acceptedClaim?.ngoId && emitToUser) {
      try {
        const volName = food.volunteerAssignment?.name || food.volunteerAssignments?.[0]?.name || 'The volunteer';
        const notif = new Notification({
          userId: acceptedClaim.ngoId,
          type: 'ACTION_REQUIRED',
          title: `⚠️ Volunteer Declined — Reassignment Needed`,
          message: `${volName} has declined the pickup task for "${food.title}". Reason: ${food.volunteerDeclineReason}. Please assign a new volunteer immediately.`,
          relatedClaimId: acceptedClaim._id,
          relatedFoodId: food._id,
          stage: 'Volunteer Declined — Reassign'
        });
        await notif.save();
        emitToUser(acceptedClaim.ngoId.toString(), 'NEW_NOTIFICATION', notif);
      } catch (notifErr) {
        console.error('CRITICAL: Volunteer decline notification failed:', notifErr.message);
        // Still return success to volunteer even if notification fails — but log it
      }
    }

    res.json({ success: true, message: 'You have declined this task. The NGO has been notified and will arrange another volunteer.' });
  } catch (err) {
    console.error('Error processing volunteer decline:', err);
    res.status(500).json({ success: false, message: 'Server error processing your decline.' });
  }
});

module.exports = router;

