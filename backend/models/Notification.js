const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'CLAIM_REQUEST',      // NGO submitted a claim → notify donor
      'CLAIM_ACCEPTED',     // Donor accepted → notify NGO
      'CLAIM_DECLINED',     // Donor declined → notify NGO
      'NGO_CONFIRMED',      // NGO confirmed their side → notify donor
      'STATUS_UPDATE',      // Generic lifecycle stage update
      'VOLUNTEER_ASSIGNED', // Volunteer assigned → notify both
      'PICKUP_CONFIRMED',   // Picked up / delivered → notify both
      'INFO'                // General informational notice
    ],
    required: true
  },
  title: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  // Link back to the specific food posting (for navigation from panel)
  relatedFoodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  },
  relatedClaimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  },
  // Current stage label in the claim lifecycle, e.g. "Awaiting donor decision"
  stage: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  // Per-user soft delete: push userId here instead of deleting the document.
  // The other party's notification is unaffected.
  dismissedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
