const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');

// @route   GET /api/ngos
// @desc    Get all registered NGOs / Receivers
router.get('/', async (req, res) => {
  try {
    const ngos = await NGO.find().sort({ verified: -1, createdAt: -1 });
    res.json(ngos);
  } catch (err) {
    console.error('Error fetching NGOs:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/ngos/register
// @desc    Register a new NGO / Verified Receiver
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      description,
      registrationNumber,
      city,
      area,
      address,
      location,
      phone,
      email,
      website,
      foodTypesAccepted,
      capacity,
      verificationStatus
    } = req.body;

    const newNgo = new NGO({
      name,
      description,
      registrationNumber,
      city: city || 'Pune',
      area,
      address,
      location: location || { lat: 18.5204, lng: 73.8567 },
      phone,
      email,
      website,
      foodTypesAccepted: foodTypesAccepted || ['Cooked Food', 'Raw Grains', 'Packaged Food'],
      capacity: capacity || '500 meals/day',
      verified: verificationStatus === 'VERIFIED_PARTNER',
      verificationStatus: verificationStatus || 'PENDING'
    });

    const savedNgo = await newNgo.save();

    // Emit event if socket is available
    const io = req.app.get('io');
    if (io) {
      io.emit('NEW_NGO_REGISTERED', savedNgo);
    }

    res.status(201).json(savedNgo);
  } catch (err) {
    console.error('Error registering NGO:', err.message);
    res.status(500).json({ message: 'Failed to register NGO', error: err.message });
  }
});

module.exports = router;
