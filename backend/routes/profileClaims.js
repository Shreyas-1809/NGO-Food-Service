const express = require('express');
const router = express.Router();
const ProfileClaim = require('../models/ProfileClaim');
const auth = require('../middleware/auth');

// Optional auth helper: decodes user if token provided, but doesn't block unauthenticated claims
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded.user;
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
};

// @route  POST /api/profile-claims
// @desc   Submit a claim request for an external NGO
// @access Public (records user ID if authenticated)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      externalOsmId, externalName, externalSource,
      externalAddress, city, coordinates,
      orgName, contactEmail, contactPhone,
      regNumber, proofDocUrl
    } = req.body;

    if (!externalName || !orgName || !contactEmail) {
      return res.status(400).json({ message: 'Organisation name, claim name, and contact email are required.' });
    }

    const claim = new ProfileClaim({
      externalOsmId,
      externalName,
      externalSource: externalSource || 'openstreetmap',
      externalAddress,
      city,
      coordinates: Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : undefined,
      orgName,
      contactEmail,
      contactPhone,
      regNumber,
      proofDocUrl,
      submittedBy: req.user ? req.user.id : null,
      submitterEmail: req.user ? req.user.email : contactEmail
    });

    await claim.save();
    res.status(201).json({ message: 'Claim submitted successfully. Our team will review it and get back to you.', claim });
  } catch (err) {
    console.error('Profile claim error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  GET /api/profile-claims
// @desc   List all pending claims (admin use — no special admin middleware yet, auth only)
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const claims = await ProfileClaim.find({ status })
      .populate('submittedBy', 'fullName orgName email')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    console.error('Fetch claims error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  PATCH /api/profile-claims/:id
// @desc   Admin: approve or reject a claim
// @access Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const claim = await ProfileClaim.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    // When approved, onboard/promote organisation into Tier 1 (Registered and Verified)
    if (status === 'approved') {
      const User = require('../models/User');
      let existingUser = await User.findOne({
        $or: [
          { email: claim.contactEmail.toLowerCase() },
          { orgName: new RegExp(`^${claim.orgName}$`, 'i') }
        ]
      });

      if (existingUser) {
        existingUser.accountType = 'ORGANISATION';
        existingUser.verified = true;
        if (!existingUser.orgName) existingUser.orgName = claim.orgName;
        if (claim.contactPhone && !existingUser.phone) existingUser.phone = claim.contactPhone;
        if (claim.externalAddress && !existingUser.address) existingUser.address = claim.externalAddress;
        if (claim.city && !existingUser.city) existingUser.city = claim.city;
        if (claim.coordinates && Array.isArray(claim.coordinates) && claim.coordinates.length === 2) {
          existingUser.location = { type: 'Point', coordinates: claim.coordinates };
        }
        await existingUser.save();
      } else {
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const newUserPayload = {
          accountType: 'ORGANISATION',
          email: claim.contactEmail.toLowerCase(),
          password: tempPassword,
          phone: claim.contactPhone || '9999999999',
          orgName: claim.orgName,
          address: claim.externalAddress || claim.externalName,
          city: claim.city || '',
          verified: true
        };
        if (claim.coordinates && Array.isArray(claim.coordinates) && claim.coordinates.length === 2) {
          newUserPayload.location = { type: 'Point', coordinates: claim.coordinates };
        }
        const newUser = new User(newUserPayload);
        await newUser.save();
      }
    }

    res.json(claim);
  } catch (err) {
    console.error('Update claim error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
