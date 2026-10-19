const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Need = require('../models/Need');
const Activity = require('../models/Activity');

// @route   POST /api/needs
// @desc    Create a new shortage/need request
// @access  Private (Organisation/NGO only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can post shortage requests' });
    }

    const { title, category, quantity, unit, urgency, description, location, neededByDate } = req.body;

    if (!title || !quantity) {
      return res.status(400).json({ message: 'Title and quantity are required' });
    }

    const needPayload = {
      ngoId: req.user.id,
      title,
      category: category || 'Food',
      quantity: Number(quantity),
      unit: unit || 'servings',
      urgency: urgency || 'HIGH',
      description,
      status: 'ACTIVE',
      neededByDate: neededByDate ? new Date(neededByDate) : undefined
    };

    if (location && location.coordinates && location.coordinates.length === 2) {
      needPayload.location = location;
    }

    const need = new Need(needPayload);
    await need.save();

    await Activity.create({
      userId: req.user.id,
      action: 'Posted Shortage Need',
      details: `Title: ${title}, Quantity: ${quantity} ${unit || 'servings'}`
    });

    const populatedNeed = await Need.findById(need._id)
      .populate('ngoId', 'orgName fullName phone email address city location');

    const io = req.app.get('io');
    if (io) {
      io.emit('NEED_CREATED', populatedNeed);
      io.emit('NEW_NEED_LISTING', populatedNeed);
    }

    res.status(201).json(populatedNeed);
  } catch (err) {
    console.error('Error creating shortage request:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/needs
// @desc    Get all active shortage requests (for feed matching)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const needs = await Need.find({ status: 'ACTIVE' })
      .populate('ngoId', 'orgName fullName phone email address city location')
      .sort({ createdAt: -1 });

    res.json(needs);
  } catch (err) {
    console.error('Error fetching shortage requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/needs/my-needs
// @desc    Get current NGO's shortage requests
// @access  Private (Organisation/NGO only)
router.get('/my-needs', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can fetch their shortage requests' });
    }

    const needs = await Need.find({ ngoId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(needs);
  } catch (err) {
    console.error('Error fetching my shortage requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/needs/:id/commit
// @desc    Commit to fulfilling a shortage (Donor only, atomic lock)
// @access  Private
router.post('/:id/commit', auth, async (req, res) => {
  try {
    const need = await Need.findOneAndUpdate(
      { _id: req.params.id, status: 'ACTIVE' },
      { status: 'CLAIMED', donorId: req.user.id, claimedAt: new Date() },
      { new: true }
    ).populate('ngoId', 'orgName fullName phone email address city location');

    if (!need) {
      const existing = await Need.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Shortage request not found' });
      }
      return res.status(409).json({ message: 'This shortage need has already been taken by another donor or fulfilled.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('NEED_UPDATED', need);
    }

    res.json(need);
  } catch (err) {
    console.error('Error committing to shortage:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/needs/:id/unclaim
// @desc    Release commitment if donor cancels donation form
// @access  Private
router.post('/:id/unclaim', auth, async (req, res) => {
  try {
    const need = await Need.findOneAndUpdate(
      { _id: req.params.id, donorId: req.user.id, status: { $in: ['CLAIMED', 'IN_PROGRESS'] } },
      { status: 'ACTIVE', donorId: null, claimedAt: null, fulfilledFoodId: null },
      { new: true }
    ).populate('ngoId', 'orgName fullName phone email address city location');

    if (need) {
      const io = req.app.get('io');
      if (io) {
        io.emit('NEED_UPDATED', need);
      }
    }

    res.json(need || { message: 'Shortage released' });
  } catch (err) {
    console.error('Error unclaiming shortage:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/needs/:id
// @desc    Edit a shortage request
// @access  Private (Organisation/NGO only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const need = await Need.findById(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Shortage request not found' });
    }
    if (need.ngoId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, category, quantity, unit, urgency, description, status, neededByDate } = req.body;

    if (title) need.title = title;
    if (category) need.category = category;
    if (quantity !== undefined) need.quantity = Number(quantity);
    if (unit) need.unit = unit;
    if (urgency) need.urgency = urgency;
    if (description !== undefined) need.description = description;
    if (status) {
      need.status = status;
      if (status === 'FULFILLED') {
        need.fulfilledAt = new Date();
      } else if (status === 'ACTIVE') {
        need.fulfilledAt = undefined;
      }
    }
    if (neededByDate) need.neededByDate = new Date(neededByDate);

    await need.save();

    const populatedNeed = await Need.findById(need._id)
      .populate('ngoId', 'orgName fullName phone email address city location');

    const io = req.app.get('io');
    if (io) {
      io.emit('NEED_UPDATED', populatedNeed);
    }

    res.json(populatedNeed);
  } catch (err) {
    console.error('Error updating shortage request:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/needs/:id
// @desc    Delete a shortage request
// @access  Private (Organisation/NGO only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const need = await Need.findById(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Shortage request not found' });
    }
    if (need.ngoId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Need.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('NEED_DELETED', { _id: req.params.id, id: req.params.id });
    }

    res.json({ message: 'Shortage request removed', _id: req.params.id, id: req.params.id });
  } catch (err) {
    console.error('Error deleting shortage request:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;