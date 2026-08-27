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

    const { title, category, quantity, unit, urgency, description, location } = req.body;

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
      status: 'ACTIVE'
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

    res.status(201).json(need);
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

// @route   PATCH /api/needs/:id
// @desc    Edit a shortage request
// @access  Private (Organisation/NGO only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const need = await Need.findById(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Shortage request not found' });
    }
    if (need.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, category, quantity, unit, urgency, description, status } = req.body;

    if (title) need.title = title;
    if (category) need.category = category;
    if (quantity !== undefined) need.quantity = Number(quantity);
    if (unit) need.unit = unit;
    if (urgency) need.urgency = urgency;
    if (description !== undefined) need.description = description;
    if (status) need.status = status;

    await need.save();
    res.json(need);
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
    if (need.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Need.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shortage request removed' });
  } catch (err) {
    console.error('Error deleting shortage request:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;