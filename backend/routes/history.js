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
    const accountType = req.user.accountType;
    let history = [];

    if (accountType === 'ORGANISATION') {
      // 1. Claims made by this NGO
      const claims = await Claim.find({ ngoId: userId })
        .populate('foodId')
        .populate({ path: 'foodId', populate: { path: 'donorId', select: 'orgName fullName' } })
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
          quantity: food.quantity,
          unit: food.items?.[0]?.unit || 'kg',
          otherPartyName: donorName,
          ngoStatus: `Requested (${claim.status})`,
          donorStatus: claim.status === 'PENDING' ? 'Awaiting Response' : claim.status,
          overallStatus,
          rejectionReason: claim.declineReason || food.rejectionReason,
          createdAt: claim.createdAt,
          pickupDetails: food.pickupAddress,
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
          ngoStatus: need.status,
          donorStatus: need.status === 'FULFILLED' ? 'Fulfilled by Donor' : 'No Donor Assigned',
          overallStatus,
          rejectionReason: null,
          createdAt: need.createdAt,
          pickupDetails: null,
          rawNeed: need
        });
      });

    } else if (accountType === 'DONOR') {
      // 1. Food posted by this Donor
      const foods = await Food.find({ donorId: userId }).sort({ createdAt: -1 });
      
      for (const food of foods) {
        // Fetch claims for this food
        const claims = await Claim.find({ foodId: food._id }).populate('ngoId', 'orgName fullName');
        
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
              quantity: food.quantity,
              unit: food.items?.[0]?.unit || 'kg',
              otherPartyName: ngoName,
              ngoStatus: `Requested (${claim.status})`,
              donorStatus: claim.status === 'PENDING' ? 'Awaiting Response' : claim.status,
              overallStatus,
              rejectionReason: claim.declineReason || food.rejectionReason,
              createdAt: claim.createdAt,
              pickupDetails: food.pickupAddress,
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
            quantity: food.quantity,
            unit: food.items?.[0]?.unit || 'kg',
            otherPartyName: 'N/A (No claims yet)',
            ngoStatus: 'None',
            donorStatus: food.status,
            overallStatus,
            rejectionReason: food.rejectionReason,
            createdAt: food.createdAt,
            pickupDetails: food.pickupAddress,
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
    res.status(500).send('Server Error');
  }
});

module.exports = router;
