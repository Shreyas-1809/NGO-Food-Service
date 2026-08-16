const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  donorPhone: { type: String },
  category: { 
    type: String, 
    enum: ['Food', 'Clothes', 'Books', 'Electronics', 'Furniture', 'Hygiene', 'Medical Supplies', 'Toys', 'Household', 'Monetary', 'Other'],
    default: 'Food' 
  },
  title: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  foodType: { type: String }, // Rice, Wheat, Dal, Pulses, Fruits, Vegetables, Packaged Food, Cooked Food, Other
  excessDetails: { type: String },
  condition: { type: String, default: 'Fresh / New' },
  expiryDate: { type: Date },
  preparedDate: { type: Date },
  storageCondition: { type: String, enum: ['Normal', 'Refrigerated', 'Frozen'], default: 'Normal' },
  description: { type: String },
  photoUrl: { type: String },
  pickupLocation: { type: String, required: true },
  pickupCoords: {
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 }
  },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  volunteerName: { type: String },
  volunteerPhone: { type: String },
  volunteerCoords: {
    lat: { type: Number, default: 18.5230 },
    lng: { type: Number, default: 73.8500 }
  },
  ngoCoords: {
    lat: { type: Number, default: 18.5308 },
    lng: { type: Number, default: 73.8474 }
  },
  availabilityDate: { type: String },
  availabilityTime: { type: String },
  urgency: { type: String, enum: ['HIGH', 'MEDIUM', 'NORMAL'], default: 'NORMAL' },
  status: { 
    type: String, 
    enum: ['CREATED', 'AVAILABLE', 'MATCHED', 'VOLUNTEER_ASSIGNED', 'FOOD_PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'], 
    default: 'AVAILABLE' 
  },
  matchedNgoId: { type: String },
  matchedNgoName: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);
