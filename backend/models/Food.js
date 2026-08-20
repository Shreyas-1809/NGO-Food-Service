const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  foodType: { type: String, enum: ['VEG', 'NON-VEG', 'RAW PRODUCE', 'BAKED GOODS'], required: true },
  preparedTime: { type: Date, required: true },
  expiryTime: { type: Date, required: true },
  status: { type: String, enum: ['AVAILABLE', 'CLAIMED', 'COMPLETED'], default: 'AVAILABLE' },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationCode: { type: String },
  pickupAddress: { type: String },
  pickupTimeSlot: {
    start: Date,
    end: Date
  },
  items: [{
    itemName: String,
    quantity: Number,
    foodType: { type: String, enum: ['VEG', 'NON-VEG'] },
    category: { type: String, enum: ['Cooked Meal', 'Raw Produce', 'Baked Goods', 'Packaged'] },
    unit: { type: String, enum: ['Kilograms', 'Dozen', 'Portions', 'Liters', 'servings', 'plates', 'kg'] },
    preparedTime: Date,
    expiryTime: Date,
    photoUrl: String
  }],
  photos: [String],
  overallExpiry: Date,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
}, { timestamps: true });

FoodSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Food', FoodSchema);
