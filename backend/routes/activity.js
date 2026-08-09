const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// @route   GET /api/activity
// @desc    Get current user's activity history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50); // limit to recent 50 activities
    res.json(activities);
  } catch (err) {
    console.error('Activity Fetch Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
