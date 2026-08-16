const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  registrationNumber: { type: String },
  city: { type: String, default: 'Pune' },
  area: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  foodTypesAccepted: [{ type: String }],
  capacity: { type: String, default: '500 meals/day' },
  verified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['VERIFIED_PARTNER', 'PENDING', 'COMMUNITY_RECEIVER'], 
    default: 'PENDING' 
  },
  logoUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('NGO', NGOSchema);
