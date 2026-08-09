const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  foodDetails: {
    title: String,
    category: { type: String, enum: ['VEG', 'NON-VEG', 'BOTH'] },
    estimatedPortions: Number,
    weightKg: Number,
    cookedTime: Date,
    storageTemp: String
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  pickupWindow: {
    startTime: Date,
    deadline: Date
  },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED'], 
    default: 'AVAILABLE' 
  },
  claimToken: String,
  qrCodeData: String
}, { timestamps: true });

ListingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Listing', ListingSchema);
