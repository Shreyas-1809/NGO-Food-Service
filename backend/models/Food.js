const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  foodType: { type: String, enum: ['VEG', 'NON-VEG'], required: true },
  preparedTime: { type: Date, required: true },
  expiryTime: { type: Date, required: true },
  status: { type: String, enum: ['AVAILABLE', 'CLAIMED', 'COMPLETED'], default: 'AVAILABLE' },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationCode: { type: String },
  items: [{
    itemName: String,
    quantity: Number,
    unit: { type: String, enum: ['Kilograms', 'Dozen', 'Portions', 'Liters'] },
    preparedTime: Date,
    expiryTime: Date
  }],
  overallExpiry: Date,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
}, { timestamps: true });

FoodSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Food', FoodSchema);
