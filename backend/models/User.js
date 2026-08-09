const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  accountType: { type: String, enum: ['ORGANISATION', 'DONOR'], required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  // Organisation fields
  orgName: { type: String },
  city: { type: String },
  pincode: { type: String },
  address: { type: String },
  // Personal / Donor fields
  fullName: { type: String },
  businessName: { type: String },
  businessDetails: {
    shopAddress: String,
    shopPincode: String,
    shopEmail: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // Default [longitude, latitude]
    }
  }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' }, { sparse: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
