const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Claim = require('../models/Claim');
const Food = require('../models/Food');
const Need = require('../models/Need');
const User = require('../models/User');

// Helper to normalize the status based on existing strings
const mapStatus = (status, declineReason) => {
  if (['DECLINED', 'REJECTED'].includes(status?.toUpperCase())) return 'CANCELLED';
  if (status?.toUpperCase() === 'PENDING') return 'PENDING';
  if (status?.toUpperCase() === 'ACCEPTED') return 'ACCEPTED';
  if (status?.toUpperCase() === 'FULFILLED' || status?.toUpperCase() === 'COMPLETED') return 'COMPLETED';
  if (status?.toUpperCase() === 'ACTIVE' || status?.toUpperCase() === 'AVAILABLE') return 'ACTIVE';
  return status?.toUpperCase() || 'UNKNOWN';
};

// @route   GET /api/history
// @desc    Get aggregated donation and fulfilment history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let accountType = (req.user.accountType || '').toUpperCase();
    
    // Fallback: If accountType is missing from JWT payload, lookup user in DB
    if (!accountType) {
      const dbUser = await User.findById(userId).select('accountType');
      accountType = (dbUser?.accountType || '').toUpperCase();
    }

    const isOrg = accountType === 'ORGANISATION' || accountType === 'ORGANIZATION';
    const isDonor = accountType === 'DONOR';

    let history = [];

    if (isOrg) {
      // 1. Claims made by this NGO
      const claims = await Claim.find({ ngoId: userId })
        .populate('foodId')
        .populate({ path: 'foodId', populate: { path: 'donorId', select: 'orgName fullName phone email address city' } })
        .sort({ createdAt: -1 });

      claims.forEach(claim => {
        const food = claim.foodId;
        if (!food) return; // if food was deleted

        const donorName = food.donorId?.orgName || food.donorId?.fullName || 'Donor';
        const overallStatus = mapStatus(claim.status);
        
        history.push({
          _id: `claim-${claim._id}`,
          recordType: 'CLAIM',
          direction: 'SENT',
          itemTitle: food.title || 'Surplus Food',
          category: 'Food',
          quantity: food.quantity || 0,
          unit: food.items?.[0]?.unit || 'kg',
          otherPartyName: donorName,
          otherPartyPhone: food.donorId?.phone || '',
          otherPartyEmail: food.donorId?.email || '',
          ngoStatus: `Requested (${claim.status})`,
          donorStatus: claim.status === 'PENDING' ? 'Awaiting Response' : claim.status,
          overallStatus,
          rejectionReason: claim.declineReason || food.rejectionReason,
          createdAt: claim.createdAt,
          pickupDetails: food.pickupAddress || 'Not specified',
          rawClaim: claim,
          rawFood: food
        });
      });

      // 2. Needs posted by this NGO (Shortages)
      const needs = await Need.find({ ngoId: userId }).sort({ createdAt: -1 });
      needs.forEach(need => {
        const overallStatus = mapStatus(need.status);
        history.push({
          _id: `need-${need._id}`,
          recordType: 'NEED',
          direction: 'POSTED',
          itemTitle: need.title,
          category: need.category,
          quantity: need.quantity,
          unit: need.unit,
          otherPartyName: 'N/A (Open Request)',
          otherPartyPhone: '',
          otherPartyEmail: '',
          ngoStatus: need.status,
          donorStatus: need.status === 'FULFILLED' ? 'Fulfilled by Donor' : 'No Donor Assigned',
          overallStatus,
          rejectionReason: null,
          createdAt: need.createdAt,
          pickupDetails: null,
          rawNeed: need
        });
      });

    } else if (isDonor) {
      // 1. Food posted by this Donor
      const foods = await Food.find({ donorId: userId }).sort({ createdAt: -1 });
      
      for (const food of foods) {
        // Fetch claims for this food
        const claims = await Claim.find({ foodId: food._id }).populate('ngoId', 'orgName fullName phone email address city');
        
        if (claims.length > 0) {
          claims.forEach(claim => {
            const ngoName = claim.ngoId?.orgName || claim.ngoId?.fullName || 'NGO';
            const overallStatus = mapStatus(claim.status);

            history.push({
              _id: `claim-${claim._id}`,
              recordType: 'CLAIM',
              direction: 'RECEIVED',
              itemTitle: food.title || 'Surplus Food',
              category: 'Food',
              quantity: food.quantity || 0,
              unit: food.items?.[0]?.unit || 'kg',
              otherPartyName: ngoName,
              otherPartyPhone: claim.ngoId?.phone || '',
              otherPartyEmail: claim.ngoId?.email || '',
              ngoStatus: `Requested (${claim.status})`,
              donorStatus: claim.status === 'PENDING' ? 'Awaiting Response' : claim.status,
              overallStatus,
              rejectionReason: claim.declineReason || food.rejectionReason,
              createdAt: claim.createdAt,
              pickupDetails: food.pickupAddress || 'Not specified',
              rawClaim: claim,
              rawFood: food
            });
          });
        } else {
          // Food has no claims yet
          const overallStatus = mapStatus(food.status);
          history.push({
            _id: `food-${food._id}`,
            recordType: 'FOOD',
            direction: 'POSTED',
            itemTitle: food.title || 'Surplus Food',
            category: 'Food',
            quantity: food.quantity || 0,
            unit: food.items?.[0]?.unit || 'kg',
            otherPartyName: 'N/A (No claims yet)',
            ngoStatus: 'None',
            donorStatus: food.status,
            overallStatus,
            rejectionReason: food.rejectionReason,
            createdAt: food.createdAt,
            pickupDetails: food.pickupAddress || 'Not specified',
            rawFood: food
          });
        }
      }
    }

    // Sort combined history descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

module.exports = router;
