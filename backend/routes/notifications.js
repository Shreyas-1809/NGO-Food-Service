const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET /api/notifications/:userId
// @desc    Get all non-dismissed notifications for a user (newest first)
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to view these notifications' });
    }
    // Exclude any notification the requesting user has soft-deleted
    const notifications = await Notification.find({
      userId: req.params.userId,
      dismissedBy: { $ne: req.user.id }
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error('Error updating notification:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Soft-delete a notification for the requesting user only.
//          Pushes the user's ID into `dismissedBy[]` — the document is NOT
//          destroyed, so the other party's copy of the same notification is
//          completely unaffected. Persists across page refreshes.
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Any user who can see a notification may dismiss it for themselves.
    // The notification must belong to them (userId) to prevent arbitrary dismissals.
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Idempotent: only push if not already in the array
    if (!notification.dismissedBy.map(id => id.toString()).includes(req.user.id)) {
      notification.dismissedBy.push(req.user.id);
      await notification.save();
    }

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    console.error('Error dismissing notification:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all read:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Soft-delete all notifications for the current user
// @access  Private
router.delete('/clear-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, dismissedBy: { $ne: req.user.id } },
      { $addToSet: { dismissedBy: req.user.id } }
    );
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    console.error('Error clearing all notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
