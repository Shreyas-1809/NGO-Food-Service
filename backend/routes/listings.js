const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Get all available listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'AVAILABLE' }).populate('donorId', 'name organizationName');
    res.json(listings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create a listing (Donor)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'DONOR') return res.status(403).json({ message: 'Only Donors can post food' });

  try {
    const { foodDetails, location, pickupWindow } = req.body;
    const newListing = new Listing({
      donorId: req.user.id,
      foodDetails,
      location,
      pickupWindow
    });

    const listing = await newListing.save();

    // Emit NEW_FOOD_LISTING to all sockets
    req.app.get('io').emit('NEW_FOOD_LISTING', listing);

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Claim a listing (NGO)
router.post('/:id/claim', auth, async (req, res) => {
  if (req.user.role !== 'NGO') return res.status(403).json({ message: 'Only NGOs can claim food' });

  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'AVAILABLE') return res.status(400).json({ message: 'Listing is no longer available' });

    listing.status = 'CLAIMED';
    listing.recipientId = req.user.id;
    listing.claimToken = crypto.randomBytes(16).toString('hex');
    listing.qrCodeData = JSON.stringify({ listingId: listing.id, claimToken: listing.claimToken });

    await listing.save();
    
    // Emit update
    req.app.get('io').emit('LISTING_UPDATED', listing);

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
