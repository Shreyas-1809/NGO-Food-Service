const Notification = require('../models/Notification');

function sanitizeMessage(msg) {
  if (!msg) return '';
  return String(msg)
    .replace(/\b(verification|handover|pickup)?\s*code[:\s]?\s*\d{4}\b/gi, '')
    .replace(/\s*4-digit code:?\s*\d{4}/gi, '')
    .replace(/\(code:?\s*\d{4}\)/gi, '')
    .trim();
}

/**
 * Upsert exactly one notification per user per donation.
 * If one already exists for (userId, relatedFoodId), it is updated in place.
 * Emits realtime socket events to the user room.
 */
async function upsertDonationNotification({
  userId,
  foodId,
  claimId = null,
  type,
  title,
  message,
  stage,
  emitToUser,
  io
}) {
  if (!userId) return null;
  const cleanMsg = sanitizeMessage(message);

  let notif = null;
  if (foodId) {
    notif = await Notification.findOne({
      userId,
      relatedFoodId: foodId
    });
  }

  if (notif) {
    notif.type = type;
    if (title) notif.title = title;
    notif.message = cleanMsg;
    if (stage) notif.stage = stage;
    if (claimId) notif.relatedClaimId = claimId;
    notif.read = false;
    // Remove user from dismissedBy so it resurfaces
    notif.dismissedBy = (notif.dismissedBy || []).filter(id => id.toString() !== userId.toString());
    notif.updatedAt = new Date();
    await notif.save();
  } else {
    notif = new Notification({
      userId,
      type,
      title,
      message: cleanMsg,
      relatedFoodId: foodId,
      relatedClaimId: claimId,
      stage,
      read: false
    });
    await notif.save();
  }

  let payload = notif.toObject();
  try {
    const populated = await Notification.findById(notif._id)
      .populate('relatedFoodId')
      .populate({
        path: 'relatedClaimId',
        populate: { path: 'foodId' }
      });
    if (populated) payload = populated.toObject();
  } catch {}

  if (emitToUser) {
    emitToUser(userId.toString(), 'NEW_NOTIFICATION', payload);
    emitToUser(userId.toString(), 'NOTIFICATION_UPDATED', payload);
  }

  return notif;
}

/**
 * Clean up / remove notifications for terminal donation states
 * (delivered / completed, cancelled, expired) for both sides.
 */
async function clearDonationNotifications(foodId, emitToUser, io, userIds = []) {
  if (!foodId) return;
  try {
    const existing = await Notification.find({ relatedFoodId: foodId });
    const affectedUserIds = new Set((userIds || []).map(id => id?.toString?.() || String(id)));
    existing.forEach(n => affectedUserIds.add(n.userId.toString()));

    await Notification.deleteMany({ relatedFoodId: foodId });

    affectedUserIds.forEach(uid => {
      if (emitToUser && uid) {
        emitToUser(uid, 'NOTIFICATION_CLEARED', { foodId: foodId.toString() });
      }
    });

    if (io) {
      io.emit('NOTIFICATION_CLEARED', { foodId: foodId.toString() });
    }
  } catch (err) {
    console.error('Error clearing donation notifications:', err);
  }
}

module.exports = {
  sanitizeMessage,
  upsertDonationNotification,
  clearDonationNotifications
};
