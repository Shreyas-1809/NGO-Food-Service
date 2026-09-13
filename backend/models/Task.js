const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: false
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleNumber: { type: String, default: '' },
    assignedAt: { type: Date, default: Date.now }
  },
  status: {
    type: String,
    enum: ['assigned', 'en_route', 'declined', 'picked_up', 'delivered'],
    default: 'assigned',
    index: true
  },
  confirmationTokens: {
    volunteerToken: { type: String },
    pickupToken: { type: String },
    pickupUsedAt: { type: Date, default: null },
    deliveryToken: { type: String },
    deliveryUsedAt: { type: Date, default: null }
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  declineReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
