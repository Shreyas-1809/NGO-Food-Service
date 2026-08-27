const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    default: 'PENDING'
  },
  message: {
    type: String
  },
  requestedPickupTime: {
    type: String
  },
  declineReason: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Claim', ClaimSchema);
